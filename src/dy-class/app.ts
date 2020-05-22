import 'reflect-metadata'
import _pickBy from 'lodash/pickBy'


const PROPERTIES_META = Symbol('PROPERTIES_META')
const DESCENDANTS = Symbol('DESCENDANTS')
const SEQUENCE = Symbol('SEQUENCE')

type Constructor<T = any> = { new(...args: any[]): T }
type Factory = Function | Constructor | string
type Indexable = { [key: string]: any }
type BaseConstructorPayload<T, U = undefined> = Partial<U extends undefined ? T : T | U>

interface PropertiesMeta {
  [key: string]: {
    factory: Factory
    options: PropertyOptions
  }
}

interface Descendants {
  [key: string]: Constructor
}

class PropertyOptions {
  required?: boolean = true
}

export const Model = (constructor: Function)=>{
  const metadata = Reflect.getMetadata(DESCENDANTS, Base.constructor) || {}
  metadata[constructor.name] = constructor
  Reflect.defineMetadata(DESCENDANTS, metadata, Base.constructor)
}

export function Primed(
  factory: Factory,
  propertyOptions: PropertyOptions = {}
) {
  return (instance: any, propertyKey: string | symbol) => {
    const options = Object.assign(new PropertyOptions(), propertyOptions)
    const metadata = Reflect.getMetadata(PROPERTIES_META, instance) || {}
    metadata[propertyKey] = { factory, options }
    Reflect.defineMetadata(PROPERTIES_META, metadata, instance)
  }
}

export class Base<T, U = undefined>{
  constructor(payload: BaseConstructorPayload<T, U> = {}){
    const primedProperties: PropertiesMeta = Reflect.getMetadata(PROPERTIES_META, this)
    const notPrimed = _pickBy((payload as Indexable), (k: string) => !(k in primedProperties))
    for(const key in notPrimed){
      if(this.hasOwnProperty(key)){
        (this as Indexable)[key]= (payload as Indexable)[key]
      }
    }

    for(const key in primedProperties){
      let { factory, options } = primedProperties[key]
      if(typeof factory === 'string'){
        const descendants: Descendants = Reflect.getMetadata(DESCENDANTS, Base.constructor)
        if(!descendants[factory]){
          throw Error(`Class ${factory} was never added`)
        }
        factory = descendants[factory]
      }

      if ((payload as Indexable)[key] !== undefined || options.required) {
        const args = (payload as Indexable)[key] !== undefined ? [(payload as Indexable)[key]] : []
        if(factory.prototype instanceof Base){
          (this as Indexable)[key] = new (factory as Constructor)(...args)
        } else {
          (this as Indexable)[key] = (factory as Function)(...args)
        }
      }
    }
  }

  clone(){
    return new (this.constructor as Constructor<T>)(this)
  }
}

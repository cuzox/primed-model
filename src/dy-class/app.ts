import 'reflect-metadata'
import _pickBy from 'lodash/pickBy'


const PROPERTIES_META = Symbol('PROPERTIES_META')
const DESCENDANTS = Symbol('DESCENDANTS')

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
    this.init(payload)
  }

  private init(payload: Indexable = {}, stack: string[] = []){
    const primedProperties: PropertiesMeta = Reflect.getMetadata(PROPERTIES_META, this)
    const newStack = [this.constructor.name, ...stack]

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

      const value = (payload as Indexable)[key]
      if (value !== undefined || options.required) {
        if(factory.prototype instanceof Base){
          // -1 for how many levels we will allow
          const isCyclic = newStack.slice(0,-1).some(x => x === (factory as Constructor).name)
          if(!isCyclic || value !== undefined){
            (this as Indexable)[key] = Object.create(factory.prototype).init(value, newStack)
          }
        } else {
          const args = value !== undefined ? [value] : []
          ;(this as Indexable)[key] = (factory as Function)(...args)
        }
      }
    }

    return this
  }

  clone(){
    return new (this.constructor as Constructor<T>)(this)
  }
}

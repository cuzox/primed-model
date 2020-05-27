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
  array?: boolean = false
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

  private init(payload: Indexable = {}, trace: string[] = []){
    const primedProperties: PropertiesMeta = Reflect.getMetadata(PROPERTIES_META, this)
    const newTrace = [this.constructor.name, ...trace]

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

      // -1 for how many levels we will allow
      const isCyclic = newTrace.slice(0,-1).some(x => x === (factory as Constructor).name)
      if(isCyclic){
        continue
      }

      const value = (payload as Indexable)[key]
      if(options.array && value && !Array.isArray(value)){
        throw Error(`Array expected for field ${key}`)
      }

      if (value !== undefined) {
        const values: any = Array.isArray(value) ? value : [value]
        let instances: any[] = []
        if(factory.prototype instanceof Base){
          instances = values.map((val: any) =>
            Object.create((factory as Constructor).prototype).init(val, newTrace)
          )
        } else {
          const getArgs = (value: any) => value !== undefined ? [value] : []
          instances = values.map((val: any) =>
            (factory as Function)(...getArgs(val))
          )
        }
        (this as Indexable)[key] = options.array ? instances : instances.pop()
      } else if (options.required){
        let instance
        if(factory.prototype instanceof Base){
          instance = Object.create((factory as Constructor).prototype).init(undefined, newTrace)
        } else {
          const getArgs = (value: any) => value !== undefined ? [value] : []
          instance = (factory as Function)()
        }
        (this as Indexable)[key] = options.array ? [instance] : instance
      }
    }

    return this
  }

  clone(){
    return new (this.constructor as Constructor<T>)(this)
  }
}

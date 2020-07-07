import 'reflect-metadata'
import _pickBy from 'lodash/pickBy'


const PRIMED_PROPERTIES_META = Symbol('PRIMED_PROPERTIES_META')
const DESCENDANTS = Symbol('DESCENDANTS')

type Constructor<T = any> = { new(...args: any[]): T }
type Factory = Function | Constructor | string
type Indexable = { [key: string]: any }

//https://github.com/krzkaczor/ts-essentials
type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends Array<infer U>
		? Array<DeepPartial<U>>
		: T[P] extends ReadonlyArray<infer U>
			? ReadonlyArray<DeepPartial<U>>
			: DeepPartial<T[P]>
};

type BaseConstructorPayload<T, U = undefined> = DeepPartial<U extends undefined ? T : T | U>

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

export function Model(constructor: Constructor): void
export function Model(name: string): (constructor: Constructor) => void
export function Model<T extends Constructor>(
	constructorOrName: string | T
) {
	const metadata = Reflect.getMetadata(DESCENDANTS, Base.constructor) || {}

	if(typeof constructorOrName === 'string'){
		return (constructor: T) => {
			const extended = class extends constructor {
				constructor(...args: any[]){
					super()
					this.init(args[0], args[1])
				}
			}

			metadata[constructorOrName] = extended
			Reflect.defineMetadata(DESCENDANTS, metadata, Base.constructor)

			return extended
		}
	} else {
		const extended = class extends constructorOrName {
			constructor(...args: any[]){
				super()
				this.init(args[0], args[1])
			}
		}

		metadata[constructorOrName.name] = extended
		Reflect.defineMetadata(DESCENDANTS, metadata, Base.constructor)

		return extended
	}
}

export function Primed(
	factory: Factory,
	propertyOptions: PropertyOptions = {}
) {
	return (instance: any, propertyKey: string | symbol) => {
		const options = Object.assign(new PropertyOptions(), propertyOptions)
		const metadata = Reflect.getMetadata(PRIMED_PROPERTIES_META, instance) || {}
		metadata[propertyKey] = { factory, options }
		Reflect.defineMetadata(PRIMED_PROPERTIES_META, metadata, instance)
	}
}

export class Base<T, U = undefined>{
	// Method purely for typing purposes
	constructor(payload?: BaseConstructorPayload<T, U>){}

	private init(payload: Indexable = {}, trace: Set<Constructor> = new Set()){
		const primedProperties: PropertiesMeta = Reflect.getMetadata(PRIMED_PROPERTIES_META, this) || {}
		const updatedTrace = new Set(trace).add(this.constructor as Constructor)
		const notPrimed = _pickBy(payload, (val: any, k: string) => !(k in primedProperties))

		for(const key in notPrimed){
			if(this.hasOwnProperty(key)){
				(this as Indexable)[key]= payload[key]
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

			const value = payload[key]
			if(options.array && payload && payload[key] && !Array.isArray(value)){
				throw Error(`Array expected for field ${key}`)
			} else if (!options.array && value && Array.isArray(value)){
				throw Error(`Array not expected for field ${key}`)
			}

			if (value !== undefined && value !== null) {
				const values: any = Array.isArray(value) ? value : [value]
				let instances: any[] = []
				if(factory.prototype instanceof Base){
					instances = values.map((val: any) =>
						Reflect.construct((factory as Constructor), [val, updatedTrace])
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
					const isCyclic = updatedTrace.has(factory as Constructor)
					if(isCyclic){
						continue
					}
					instance = Reflect.construct((factory as Constructor), [undefined, updatedTrace])
				} else {
					instance = (factory as Function)()
				}
				(this as Indexable)[key] = options.array ? [instance] : instance
			} else if (options.array) {
				(this as Indexable)[key] = []
			} else {
				(this as Indexable)[key] = null
			}
		}

		return this
	}

	clone(): T{
		return Reflect.construct(this.constructor, [this])
	}
}

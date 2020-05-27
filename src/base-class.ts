import { DateTime } from 'luxon'
import { Decimal } from 'decimal.js'
import { Base, Model, Primed } from './app'
import { PrimedDate, PrimedDateTime, PrimedDecimal, PrimedId, PrimedUUID } from './primed'

@Model
export class Bar extends Base<Bar>{
  @Primed(PrimedDecimal)
  golf!: Decimal

  @Primed('Baz')
  baz!: Baz

  hotel: number = 2
  india: string = "4"
  juliet: string = "4"
  kilo: boolean = false
  lima: boolean = false
}

interface FooInput{
  number: number,
  someDate: string,
  someOtherDate: string,
}

@Model
export class Foo extends Base<Foo, FooInput>{
  @Primed(PrimedId)
  id!: string

  charlie: string = ""
  delta: string = "4"
  echo: boolean = false
  foxtrot: boolean = true

  @Primed(PrimedDecimal)
  number!: Decimal

  @Primed(PrimedDateTime)
  someDate!: DateTime

  @Primed(PrimedDate)
  someOtherDate!: Date

  @Primed(Bar)
  bar!: Bar

  @Primed('Baz', {array: true})
  baz!: Baz[]

  @Primed(Foo)
  parentFoo!: Foo

  @Primed('Baz', {required: false})
  otherBaz?: Baz

  get total(){
    return this.number.plus(this.bar.golf)
  }

  run(){

  }
}

@Model
export class Baz extends Base<Baz>{
  @Primed(PrimedDecimal)
  mike!: Decimal

  @Primed(PrimedDecimal)
  november!: Decimal

  @Primed(Bar)
  bar!: Bar

  oscar: string = ""
  papa: string = "4"
  quebec?: boolean
  romeo: boolean = false
}

console.log(new Foo())

export default {
  Foo,
  Bar,
  Baz,
}

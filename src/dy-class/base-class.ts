import { DateTime } from 'luxon';
import { Decimal } from 'decimal.js';
import { Base, Model, Property } from './app'
import { PrimedDate, PrimedDateTime, PrimedDecimal, PrimedId, PrimedUUID } from './primed'

@Model
export class Bar extends Base<Bar>{
  @Property(Number)
  golf!: number

  @Property(Number)
  hotel: number = 2

  @Property(String)
  india!: string

  @Property(String)
  juliet: string = "4"

  @Property(String)
  kilo!: boolean

  @Property(String)
  lima: boolean = false
}

interface FooInput {
  number: number,
  someDate: string,
  someOtherDate: string,
}

@Model
export class Foo extends Base<Foo, FooInput>{
  @Property(PrimedId)
  id!: string

  @Property(Number)
  alpha!: number

  @Property(Number)
  bravo: number = 2

  @Property(String)
  charlie!: string

  @Property(String)
  delta: string = "4"

  @Property(Boolean)
  echo!: boolean

  @Property(Boolean)
  foxtrot: boolean = true

  @Property(PrimedDecimal)
  number?: Decimal

  @Property(PrimedDateTime)
  someDate!: DateTime

  @Property(PrimedDate)
  someOtherDate!: Date

  @Property(Bar)
  bar!: Bar

  @Property('Baz')
  baz!: Baz

  @Property('Baz', {required: false})
  otherBaz?: Baz

  get total(){
    return this.alpha + this.bar.golf
  }

  run(){

  }
}

@Model
export class Baz extends Base<Baz>{
  @Property(Number)
  mike!: number

  @Property(Number)
  november: number = 2

  @Property(String)
  oscar!: string

  @Property(String)
  papa: string = "4"

  @Property(String)
  quebec!: boolean

  @Property(String)
  romeo: boolean = false
}


console.log(new Foo())

export default {
  Foo,
  Bar,
  Baz,
}

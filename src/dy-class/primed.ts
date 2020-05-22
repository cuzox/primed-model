import { Decimal } from 'decimal.js'
import { DateTime } from 'luxon'
import { v4 as UUID } from 'uuid'


export function PrimedDecimal(value: number | string | Decimal = 0): Decimal {
  return new Decimal(value)
}

export function PrimedId(value?: string): string {
  return value ? value : "-1"
}

export function PrimedUUID(value?: string): string {
  return value ? value : UUID()
}

export function PrimedDate(value?: string | Date): Date {
  if(typeof value === 'undefined'){
    return new Date()
  } else {
    return new Date(value)
  }
}

export function PrimedDateTime(value?: string | DateTime): DateTime{
  if(value instanceof DateTime){
    return DateTime.fromJSDate(value.toJSDate())
  } else if(typeof value === 'string'){
    return DateTime.fromISO(value)
  } else {
    return DateTime.local()
  }
}


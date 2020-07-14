# Primed Model
Hassle free TypeScript model management

Dynamically create your instances from JSON objects to take full advantage of OOP. This approach is to be contrasted with factory functions for managing highly structured data

**Note**: This project uses reflect-metadata for storing metadata in classes and properties

## Provided resources
- `Model` <*decorator*> - To register the classes
- `Primed` <*decorator*> - To mark properties to be dynamically instantiated
- `Base` <*class*> - To extend the models, configure their constructor's typing, and give internal functionality


```typescript
@Model
class Person extends Base<Person> {
    name: string = ''
    middleName: string = ''
    lastName: string = ''

    get fullName(){
        return [this.name, this.middleName, this.lastName].join(' ').trim() || 'Empty Name'
    }

    @Primed(Person)
    parent!: Person

    @Primed('Cat', { array: true })
    cats!: Cat[]
}

@Model
class Cat extends Base<Cat>{
    name: string | null = null
    breed: string | null = null
}
```
**Note**: `Cat` is being passed to the `Primed` decorator as a *string* in the `Person` class because TS/JS does not allow classes which haven't been defined to be referenced by value


## Features

- Recursively and dynamically create model instances, automatically instantiated by default, unless `required: false` is specified in the `Primed` options
- Specify properties for classes defined after the point of reference passing a string to `Primed`
- Pass a factory function to `Primed` for custom data types
- Getters are enumerable by default so that they show when iterating over the keys or in the string representation of your class (using `JSON.stringify`)
- Provided `clone` method for copying whole instances


## Example usage
### Initializing with empty constructor

```javascript
new Person()
```

#### Output
```javascript
{
    name: "",
    middleName: "",
    lastName: "",
    fullName: "Empty Name",
    parent: {
        name: "",
        middleName: "",
        lastName: "",
        fullName: "Empty Name",
        cats: [
            {
                name: null,
                breed: null
            }
        ]
    },
    cats:[
        {
            name: null,
            breed: null
        }
    ]
}
```

### Passing JSON to constructor
```javascript
new Person({
    name: "Alice",
    lastName: "Liddell",
    cats: [
        {
            name: "garfield"
        }
    ],
    parent: {
        name: "Bob",
        cats: [
            {
                name: "Tom"
            }
        ]
    }
})
```

#### Output
```javascript
{
    name: "Alice",
    middleName: "",
    lastName: "Liddell",
    fullName: "Alice Liddell",
    parent: {
        name: "Bob",
        middleName: "",
        lastName: "",
        fullName: "Bob",
        cats: [
            {
                name: "Tom",
                breed: null
            }
        ]
    },
    cats: [
        {
            name: "Garfield",
            breed: null
        }
    ]
}
```

</td>
</tr>
</table>

## Custom properties examples

You can define your own functions that can be passed into the `Prime` decorator for custom behavior


**Luxon**'s DateTime

```typescript
import { DateTime } from 'luxon'

function PrimedDateTime(value?: string | DateTime): DateTime {
    if(value instanceof DateTime){
        return DateTime.fromJSDate(value.toJSDate()) // Copy the value
    } else if(typeof value === 'string'){
        return DateTime.fromISO(value) // Build from string
    } else {
        return DateTime.local() // Create default value
    }
}

@Model
class Foo extends Base<Foo>{
    @Primed(PrimedDateTime)
    someDateTime!: DateTime
}
```

<details>
<summary> Decimal from decimal.js </summary>

```typescript
import { Decimal } from 'decimal.js'

function PrimedDecimal(value: number | string | Decimal = 0): Decimal {
    return new Decimal(value)
}
```
</details>


<details>
<summary> JavaScript's Date </summary>

```typescript
function PrimedDate(value?: string | Date): Date {
    if(typeof value === 'undefined'){
        return new Date() // Create default value
    } else {
        return new Date(value) // Build from string or copy existing
    }
}
```

</details>

<details>
<summary> string id </summary>

```typescript
function PrimedId(value?: string): string {
    return value ? value : "-1"
}
```

</details>


## Noteworthy
- If you're minifying/compressing/uglyfing your JS, you must pass a string to the `Model` decorator with the name or the class. The function name is being relied uppon for initializing properties that depend on it at runtime
    ```typescript
    @Model('Foo')
    class Foo extends Base<Foo>{
        @Primed(Bar)
        bar!: Bar
    }
    ```
- Pass `required: false` to the `Primed` *options* to prevent primed properties from being automatically instantiated
    ```typescript
    @Model
    class Foo extends Base<Foo>{
        @Primed(Bar, { required: false })
        bar!: Bar
    }
    ```
- Pass `array: true` to the `Primed` *options* to automatically instantiate arrays
    ```typescript
    @Model
    class Foo extends Base<Foo>{
        @Primed(Bar, { array: true })
        bar!: Bar[]
    }
    ```
- If the payload type differs from the class's type and you want those typings, you can pass an second interface (which can be a partial of the class) to the `Base` class when extending
    ```typescript
    interface FooInput{
        someNumber: number,
        someDate: string,
    }

    @Model
    class Foo extends Base<Foo, FooInput>{
        someString: string = ''

        @Primed(PrimedDecimal)
        someNumber!: Decimal

        @Primed(PrimedDateTime)
        someDate!: DateTime
    }
    ```
- Auto initialization will stop after detecting a circular reference

    ```typescript
    @Model
    class Alpha extends Base<Alpha> {
        @Primed('Bravo')
        bravo!: Bravo
    }

    @Model
    class Bravo extends Base<Bravo> {
        @Primed('Charlie')
        charlie!: Charlie
    }

    @Model
    class Charlie extends Base<Charlie> {
        @Primed(Alpha)
        alpha!: Alpha
    }

    new Alpha()
    ```

    #### Output

    ```javascript
    {
        bravo: {
            charlie: {
                alpha: {
                    bravo: undefined
                }
            }
        }
    }
    ```

## To do

- Add tests
- Implement change detection mechanism

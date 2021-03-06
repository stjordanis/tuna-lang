import { OPSIFY_MANIFEST, Transformer } from 'conder_core';
import { TUNA_TO_LOCKS, TUNA_TO_MANIFEST } from '../main/assembled';

function tunaTest(maybeSucceed: "succeed" | "fail", code: string): jest.ProvidesCallback {
    return (cb) => {
        if (maybeSucceed === "succeed") {
            const ops = TUNA_TO_MANIFEST.then(new Transformer(i => {
                expect(i).toMatchSnapshot("intermediate representation")
                
                return i
            })).then(OPSIFY_MANIFEST).tap(data => {
                expect(data).toMatchSnapshot("OPS")
            }).run(code)
            const locks = TUNA_TO_LOCKS.run(code)
            expect(locks).toMatchSnapshot("locks")

        } else {
            expect(() => TUNA_TO_MANIFEST.run(code)).toThrowErrorMatchingSnapshot()
        }
        cb()
    }
}

describe("language", () => {

    it("should allow a global object", tunaTest("succeed", `const obj = {}`))
        

    it("should allow many global objects",
        tunaTest("succeed", `
        const obj1 = {}
        const obj2 = {}
        `)
    )

    it("should allow empty pub funcs", 
    tunaTest("succeed", `pub func doSomething() {}`))

    it("should allow a fixed number of args in functions",
    tunaTest("succeed", `pub func argy(a, b, c) {

    }`)
    )

    it("should allow return statements within functions",
    tunaTest("succeed", `pub func returny() {
        return
    }`))

    it("should allow setting of keys on a global object", 
    
        tunaTest("succeed",
        `
        const gg = {}
        pub func fff(a) {
            gg.abc = a
            gg[a] = a
            gg['abc'] = a
        }
        `)
    )

    it("should allow none", tunaTest("succeed", 
    `
    pub func a() {
        return none
    }
    `
    ))

    it("should allow array literals", tunaTest("succeed",
    `
    pub func a() {
        return []
    }
    `
    ))


    it("should allow getting of nested keys",
    
        tunaTest("succeed",
        `
        const gg = {}
        pub func fff(a) {
            return gg[a].field
        }
        `)
    )

    it('should allow bools, numbers, and strings', tunaTest("succeed", `
    
    pub func fff(a) {
        true
        false
        12
        -12.12
        'hello world'
        {}
    }
    
    `))
    
    it('can declare temp variables', tunaTest("succeed", `
    
    pub func fff(a) {
        const b = true
        let c = false
        const d = a[b]
    }
    
    `))

    it('can overwrite inputs', tunaTest("succeed", `
    
    pub func fff(a) {
        a = false
    }
    `))

    it('cannot have duplicate variables', tunaTest("fail", `
    
    pub func fff(a) {
        const a = true
    }
    `))

    it('cannot have a variable with the same name as a function', tunaTest("fail", `
    
    pub func fff(a) {
        const fff = 12
    }
    `))

    it("does not allow overwriting constants", tunaTest("fail",`
    pub func fff(a) {
        const b = a
        b = 42
    }

    `))

    it("allows locking of strings", tunaTest(
        "succeed",
        `

        
        func l() {
            'some string'.lock()

            'some string'.release()
        }
        `
    ))

    it("allows global strings", tunaTest(
        "succeed",
        `
        const LOCK = 'some lock'
        
        func l() {
            LOCK.lock()

            LOCK.release()
        }
        `
    ))

    it("allows string concat", tunaTest(
        "succeed",
        `
        func concat() {
            const a = 'a'
            return a + 'b'
        }
        `
    ))
    
    it('only allows global constants', tunaTest("fail", `    
    let someVar = {}
    `))

    it('globals must be empty objects', tunaTest("fail", `
    const someVar = false
    `))

    it("allows users to call keys() on globals and locals", tunaTest("succeed",
    `
    const g = {}
    pub func f(a) {
        const b = a.keys()
        const gk = g.keys()
    }
    `
    ))

    it("allows keys on nested object", tunaTest("succeed", 
    `
    pub func f(a) {
        return a['b'].cdef.keys()
    }
    `
    ))
    it("allows getting of whole globals", tunaTest("succeed", 
    `
    const g = {}
    pub func f(a) {
        return g
    }
    `
    ))

    it("allows indexing into keys results", tunaTest("succeed",
    `
    pub func f(a) {
        return a.keys()[0]
    }
    `))

    it("allows deleting of keys in objects", tunaTest("succeed",
    `
    pub func f(a) {
        a.b.deleteField()
    }
    `
    ))
    it("allows object literals", tunaTest("succeed",
    `
    pub func a() {
        return {b: '12'}
    }
    `
    ))

    it("allows overwriting of some level of constants", tunaTest("succeed",
    `
    pub func b() {
        const a = {}
        a.c = 10
    }
    `
    ))

    it("allows expressions in object literals", tunaTest("succeed",
    `
    pub func a(b) {
        return {
            c: b
            d: b == 2
        }
    }
    `))

    it("should allow existence checking", tunaTest("succeed", 
    `
    const users = {}
    const chats = {}

    pub func create_user(name: string) {
        if users[name] != none {
            return 'user already exists'
        }
        users[name] = {chats: []}
        return 'user created'
    }

    pub func get_user(name: string) {
        return {
            exists: users[name] != none
            val: users[name]
        }
    }
    `
    ))

    it("should allow loops over inputs", tunaTest("succeed",
    `
    const users = {}
    const chats = {}
    type msg = {
        from: string,
        body: string
    }
    
    pub func send_message(m: msg, group) {
        if chats[group] != none {
            chats[group].msgs.push(m)
        } else {
            return 'group does not exist'
        }
    }
 
    pub func create_chat_group(group_name: string, initial_users: string[]) {
        for user in initial_users {
        users[user].chats.push(group_name)
        }
        
        return 'created'
    }
    `
    ))

    it("shouldn't allow deleting of whole variables", tunaTest("fail",
    `
    pub func f(b0) {
        b0.deleteField()
    }
    `
    ))

    it("allows directly indexing into function results", tunaTest(
        "succeed",
        `
        func test(a) {
            if a.next == none {
                return {result: none}
            }
            return {result: test(a.next)['result'] }
        }
        `
    ))

    // #dontlike 
    // delete should work on arrays like it does on objects
    it("allows deleting of array fields even though it produces a runtime error", tunaTest("succeed",
    `
    pub func f(b) {
       b[0].deleteField()
    }
    `
    ))

    it("allows for loops", tunaTest(
        "succeed",
        `
        pub func loop(arr) {
            for row in arr {
                return row
            }
        }
        `    
    ))

    it("ensure variables declared in for loop are cleaned up", tunaTest(
        "succeed",
        `
        const g = {}
        pub func loop() {
            for row in g.array {
                let some_scoped_var = row
            }
            const should_be_at_index_0 = g.array
            return should_be_at_index_0 
        }
        `
    ))

    describe('ifs', () => {
        it("single simple if", tunaTest(
            "succeed",
            `
            pub func maybe(a) {
                if a {
                    return a
                }
            }
            `
        ))

        it("cleans up variables in ifs", tunaTest(
            "succeed",
            `
            pub func maybe(a) {
                if a {
                    let b = a
                }
                let b = a
                return b
            }
            `
        ))

        it("allows elses", tunaTest(
            "succeed",
            `
            pub func maybe(a) {
                if a {

                } 
                else {
                    return a
                }
            }
            `
        ))

        it("else scope is cleaned up after each block", tunaTest(
            "succeed",
            `
            pub func maybe(a) {
                if a {
                    let b = a
                } else {
                    let b = a
                }
                let b = a
            }
            `
        ))

        it("allows any number of else ifs", tunaTest(
            "succeed",
            `
            pub func maybe(a) {
                if a {
                    return 'a'
                } else if a.b {
                    return 'b'
                } else if a.c {
                    return 'c'
                } else {
                    return 'd'
                }
            }
            `
        ))

        it("cleans up variables across else ifs", tunaTest(
            "succeed",
            `
            pub func maybe(a) {
                if a {
                    const b = a
                } else if a.b {
                    const b = a
                } else if a.c {
                    const b = a
                } else {
                    const b = a
                }
                const b = a
            }
            `
        ))
    })

    describe("prefix operators", () => {
        it("can 'not' values", tunaTest(
            "succeed",
            `
            pub func negate(a) {
                return not a
            }
            `
        ))

        it("- is shorthand for * -1",  tunaTest(
            "succeed",
            `
            pub func min(a) {
                return -a 
            }
            `
        ))
    })

    describe("infix operators", () => {
        it("+", tunaTest(
            "succeed",
            `
            pub func double(a) {
                return a + a
            }

            pub func zero(a) {
                return a + -a
            }
            `
        ))
        it("many concat", tunaTest(
            "succeed",
            `
            pub func concat(a, b) {
                return a + '-' + b
            }
            `
        ))

        it("*", tunaTest(
            "succeed",
            `
            pub func exponent(a) {
                return a * a
            }
            `
        ))
        it("math ordering", tunaTest(
            "succeed",
            `
            pub func check_ordering(a) {
                return 10 - a * a + 10
            }
            `
        ))

        it("/", tunaTest(
            "succeed",
            `
            pub func half(a) {
                return a / 2
            }
            `
        ))

        it("* / priority", tunaTest(

            "succeed",
            `
            pub func test() {
                return 1 - 2 * 3 / 4 + 10
            }
            `
        ))

        it("divide divide", tunaTest(
            "succeed",
            `
            pub func t() {
                return 100 / 10 / 10 + 99
            }
            `
        ))
        it("divide divide then multiply", tunaTest(
            "succeed",
            `
            pub func t() {
                return 100 / 10 / 10 * 42
            }
            `
        ))

        it("multiple parts summed", tunaTest(
            "succeed",
            `
            pub func t() {
                return 10 * 10 + 7 * 7 - 51
            }
            `
        ))

        it("divide multiply divide", tunaTest(
            "succeed",
            `
            pub func t() {
                return 10 / 2 * 4 / 2
            }
            `
        ))

        it("multiply multiply divide multiply", tunaTest(
            "succeed",
            `
            pub func f() {
                return 10 * 10 * 10 / 500 * 0.5
            }
            `
        ))

        it("minus minus plus", tunaTest(
            "succeed",
            `
            pub func f() {
                return 10 - 5 - 5 + 10
            }
            `
        ))

        it("plus plus minus", tunaTest(
            "succeed",
            `
            pub func f() {
                return 10 + 10 + 10 - 30
            }
            `
        ))

        it("multiply divide divide", tunaTest(
            "succeed",
            `
            pub func f() {
                return 100 * 2 / 25 / 8
            }
            `
        ))

        it("* / * / * ", tunaTest(
            "succeed",
            `
            pub func f() {
                return 12 * 2 / 4 * 3 / 9 * 6
            }
            `
        ))

        it("==", tunaTest(
            "succeed",
            `
            pub func comps(a) {
                if a == 12 {

                } else if a <= 1 {

                } else if a < 2 {

                } else if a > 3 {

                } else if a >= 4 {

                } else if a != 21 {

                }
            }
            `
        ))

        it("should allow mixing of comparisons and math", tunaTest(
            "succeed",
            `
            pub func t() {
                return 1 + 1 == 3 - 1
            }
            `
        ))

        it("allows ands and or", tunaTest(
            "succeed",
            `
            pub func t() {
                return true and true
            }

            pub func f() {
                return false or false
            }
            `
        ))

        it("infers intent when mixing comparisons and boolean expressions", tunaTest(
            "succeed",
            `
            pub func test() {
                return 12 < 13 and 15 > 16
            }
            `
        ))

        it("allows private functions", tunaTest(
            "succeed",
            `
            func shh() {

            }
            `
        ))

        it("allows functions to invoke other functions", tunaTest(
            "succeed",
            `
            func fib(left, right, depth) {
                if depth == 0 {
                    return right
                }
                return fib(right, left + right, depth - 1)
            }
            `
        ))

        it("make sure and suffixes on names aren't mistaken for infixes", tunaTest(
            "succeed",
            `
            pub func test(wand) {
                return wand
            }
            `
        ))
    })

    describe("mutations", () => {
        it("should allow overwrites at a parameterized level", tunaTest("succeed",
        `
        const g = {}
        pub func param(a) {
            g[a] = 12
            g.a.b.c[0] = 42
        }
        `))

        it("should allow delete at any level", tunaTest("succeed", 
        `
        const g = {}

        pub func dd(a) {
            g.a.b.c[a].deleteField()
        }
        `))

        it("push against globals and locals", tunaTest("succeed",
        `
        const g = {}
        
        pub func pushes(a) {
            a['a'].b[0].push('hello', 'world')
            g[a].b.push('goodbye', 'cruel', 'world')
        }
        `
        ))

    })
})

describe("types", () => {

    it("allows requiring inputs as primitives", tunaTest("succeed",
    `
    pub func test(a: string, b: int, c: double, d: bool) {

    }
    `))

    it("allows explicitly saying a type is any", tunaTest("succeed",
    `
    pub func t(a: any) {

    }
    `
    ))

    it("allows type aliases", tunaTest("succeed",
    `
    type MyType = bool

    pub func a(input: MyType) {
     
    }
    `
    ))

    it("should allow object types", tunaTest("succeed",
    `

    type someObj = {
        a: bool
        b: int
    }

    pub func a(input: someObj) {

    }
    `
    ))

    it("should allow array types", tunaTest("succeed",
    `
    type boolean = bool
    type obj = {
        o: int[]
    }

    pub func a(i: obj[]) {

    }
    `
    ))

    it("should allow optional types", tunaTest("succeed",
    `
    type opt = bool?

    type obj = {
        b: double?
        c: string?
    }
    
    pub func a(i: int?) {}
    pub func q(i: obj) {}
    `
    
    ))
    
})

describe("demo apps", () => {
    it("can be used to create a messenger", tunaTest("succeed",
    `

const users = {}

const chats = {}

pub func get_my_messages() {
    
    if users.a != none {
        const my_chats = users.a

        const msgs = {}
        for chat in my_chats {
            msgs[chat] = chats[chat]
        }
    }
}
    `
    ))
})
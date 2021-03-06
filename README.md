# Purpose

The Tuna programming language is designed to make it easy as possible to build scalable web services. Consequently, there are a few notable differences between tuna and general purpose programming languages you may have used before: 
1. Tuna's global state is persisted in a database, rather than held in memory.
2. In Tuna, you describe which functions to expose over the network. 

Altogether, you can build stateful web services with zero dependencies in as little as four lines of code:

```
const users = {}

pub func add_user(name) {
    users[name] = 'insert some initial data here'
}
```

These four lines mean: there is a users object which is persisted across requests, and a function called "add_user" that is exposed over an HTTP endpoint that can be called by anyone.

# Getting Started

## Installation

1. You need to first install [docker](https://docs.docker.com/get-docker/) to run tuna locally.

2. `npm i -g tuna-lang`

3. Pull containers: `tuna init`. When you run tuna, we use the containers pulled here.

## Learning
- You can run any of the "main.tuna" files using the command `tuna run`. Example projects can be found in [demos](tuna/demos).
- Questions can be asked in the [github discussions](https://github.com/Conder-Systems/tuna-lang/discussions).
- Complete documentation on the syntax, capabilities, and road map can be found [here](./DOCUMENTATION.md).

## Contributing
 - Feature requests are welcomed and may be submitted as github issues.
 - If you want to contribute, feel free to pick up an issue, and submit a pull request with your completed work.

# Disclaimer
Tuna is an experimental language and is missing notable features for performance, security, verification, and developer productivity (e.g. OO concepts, IDE integrations).

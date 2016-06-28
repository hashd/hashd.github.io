---
layout: post
title: Fun with Classes in ES6
author: Kiran
---

JavaScript was my favorite language until I met Elixir and now TypeScript for the amount of freedom it provides to the developer (probably enough to even shoot yourself on your feet). JavaScript like many other non-modern languages is trying to catch up on the developer joy train with ES6 and further specs. One of the controversial features that has been added in ES6 is **classes**, a sugar coated syntax to help create functions which would act like classes in a more standard manner.

There is enough debate surrounding the use of **classes** from ES6 and why you should avoid it and why you should it. But whats rarely talked about this particular feature is the fact that since class is a sugar coated syntax for creating functions, it is possible to return **classes** from functions just like other functions.

``` javascript
let raceBuilder = function (raceName) {
  return class Race {
    constructor(name) {
      this.raceName = raceName
      this.name = name
    }
  }
}

let Orc = raceBuilder("Orcs")
let mightyOrc = new Orc("Graeldir")
```

This is quite an unusual feature but can be leveraged to create new types during runtime. It'll be good to deal with immutable data while building classes this way to ensure the classes built are not compromised by mutating the passed the arguments.

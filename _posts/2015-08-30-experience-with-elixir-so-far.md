---
layout: post
title: My Experience with Elixir so far
---

With quite a lot of emerging languages these days like Go, Rust, Scala, Clojure, Julia, Nim, Factor, Red, Rebol, Ceylon, Kotlin and <an probable endless list here>, I wanted to give one of them a try so I picked up Rust in October 2014 for I was interested in a systems programming language and also wanted to break away from Interpreters of JavaScript and Virtual Machine of Java. Probably I didn't choose the right set of learning resources for Rust and thus found it very rusty to begin with and lost interest pretty sooner than I expected. That being said, Rust is a wonderful programming language with an interesting set of design goals which helps make safe and reliable systems.

I had heard of Elixir in 2014, but only started reading about it in May 2015 through Dave Thomas' wonderful book **Programming Elixir**. The first chapter on Pattern Matching was a great way to introduce a language according to me and I was totally sold. Had I started off learning the language from the getting started guide on Elixir's website probably this blog post could've been much different.

Elixir is interesting in the fact that its a language for the Erlang Virtual Machine (current implementation being BEAM) and Elixir code compiles down to BEAM bytecode. It's funny that I wanted to learn a language that enforced safety and reliability and ended up in a world which embraces the 'Let it crash' philosophy and yet helps build fault tolerant, highly available and reliable systems. Though I am well versed with JavaScript, Elixir is my first step into the world of only functional programming languages like Haskell, F#, ... and every day I get more excited about Elixir because they just seem to be more and more awesome stuff that I don't know yet.

Here is a list of things that I think makes Elixir, an awesome language and BEAM, a wonderful virtual machine which seems to be designed for the current era
- Pattern matching
- Dynamic yet Strong type system
- Pipeline operator
- Hygenic macros which enables metaprogramming
- Protocols and behaviours
- Actor based concurrency model
- Immutable data
- Lightweight processes, which double up as actors, combined with Immutable data help negotiate concurrency in the simplest of ways possible
- Hotcode swapping
- Tooling
  * Mix build tool
  * ExUnit, the unit test framework
  * First class documentation
  * Doctests

Elixir draws a lot of inspiration from the good parts of various modern programming languages like Ruby, Clojure, F# into its core. While Elixir has a very nice syntax to begin with, Elixir forces you to think of programs in a different way than in an Object Oriented language and that combined with Erlang/OTP way of doing stuff, things become amazingly interesting.

Ok, enough talk, let us look at some very basic code

{% hightlight elixir %}
# Calculating nth fibonacci number
# 
# Mathematical definition:
#   fib(0) -> 0
#   fib(1) -> 1
#   fib(n) -> fib(n-1) + fib(n-2)

def fib(0), do: 0
def fib(1), do: 1
def fib(n), do: fib(n-1) + fib(n-2)
{% endhighlight %}

The code is very similar to the mathematical definition of nth fibonacci number, isn't it? Let's take another example, greatest common divisor using euclid's algorithm

{% hightlight elixir %}
# Euclid's algorithm
#
# Mathematical definition:
#  gcd(a, b) when a = 0, b
#  gcd(a, b) when b = 0, a
#  gcd(a, b) = gcd(b, a mod b)

def gcd(a, 0), do: a
def gcd(0, b), do: b
def gcd(a, b), do: gcd(b, rem(a, b))
{% endhighlight %}

Again similar, isn't it?

That's it for now. I'll start off a series of blog posts soon to help people fall in love with Elixir pretty soon.

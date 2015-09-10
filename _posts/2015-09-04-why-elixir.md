---
layout: post
title: Why Elixir?
---

There was this urge in me to try out Functional Programming since quite a few days and one day I got my hands on 'Programming Elixir' by Dave Thomas. The tagline 'Functional > Concurrent > Pragmatic > Fun' particularly caught my eye and I told to myself 'How can anything that goes with Concurrency be fun'. So I started reading the first chapter on 'Pattern Matching' which I had only heard of in other languages like Scala and Rust. The chapter was not only enlightening to me but I really started to enjoy and see the power of pattern matching (little did I know that I only had a small glimpse of it in that chapter). Just that single chapter from 'Programming Elixir' and I was totally sold.

From there on every chapter I read, started to take me into a different world than that of Java and JavaScript and with every piece of Code that I had written, I started to have more fun working with functional concepts within Elixir. 

Just an FYI, there was this particular exercise to find prime numbers between two given numbers which was similar to an SPOJ question I had solved few years ago in C++ in about 200 lines of code. The first version of code I had written was about 10 lines of code with quite a lot of Enum operations but when I put in list comprehensions and other powerful constructs that Elixir provides I got it down to a single line of code which pretty much did exactly what my C++ solution did. 200 Lines of C++ code reduced to 1 Line of Elixir code with pretty much the same amount of expressiveness if not more according to me.

While I was having a lot of fun writing code in Elixir, I had come to the Chapter on Processes and since then I have this feeling of never wanting to go back to pre-Elixir learning approaches.

With enough knowledge of Elixir at this point in time, I have started to explore Erlang and Erlang Runtime/BEAM which is the origin for much of Elixir's runtime benefits. Erlang and Erlang Virtual Machine were designed for a specific problem back in the 80s tackling low latency, high availability, zero downtime, concurrent and distributed systems but these are pretty much everybody's problem in the current world. That made me quote:

> One's problem today can be everyone's problem tomorrow

Elixir clearly tries to leverage all the good parts of Erlang and tries to add to it, a much modern syntax, metaprogramming abilities, consistent behaviour, pipelines, UTF& Strings, protocols and probably the most modern tooling for any programming language.


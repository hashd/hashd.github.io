---
layout: post
title: Understanding Elixir Types
author: Kiran
---

Before working on any programming language, you'll need to understand the basic types that it provides. Coming from the world of C++, Java and JavaScript, the basic types in Elixir are a bit strange and peculiar so here I would like to cover them in an easy to understand way for those who have a similar background.

## Value Types

### Atoms
Atoms are constants where their name is its own value and it is universally same on any Erlang runtime system (BEAM). Atoms in Elixir begins with a colon `:` and can be followed by a Atom word *(Sequence of letters, digits, _ and @ signs. It may end with an exclamation point or a question mark)* or an Elixir operator.

Atoms are similar to `Symbols` in other languages.

##### examples:
{% highlight elixir %}
:name
:address
:"func/3"
:"this is crazy name"
{% endhighlight %}

### Booleans
One has the standard `true` and `false` boolean datatypes to hold the value of conditional expressions.

##### Note:
`true` and `false` are atoms of the name `:true` and `:false` respectively.

### Integers
Integers in Elixir are arbitrary sized, implying it can grow till any size until the Erlang Virtual Machine runs out of memory. That makes it different from what integers or longs are from in the world of Java, JavaScript.

Integer literals can be written in decimal, hexadecimal, octal and binary formats using its respective convention and digits can be separated by _ for brevity just like in Java.

##### examples:
{% highlight elixir %}
5232
-223232
32487394872348973247823409324098230498309483204803248065765765765765767657
0xbadfec
0o17423
0b101010
{% endhighlight %}

### Floating point numbers
Floating-point numbers are written using a decimal point and there must be at least one digit after and before the decimal point.

Floats are IEEE754 double precision, giving them about 16 digits of accuracy and a maximum exponent of around 10^308.

This is equivalent of double in Java and floating point numbers in JavaScript easy to follow. But do not use them for currency related calculations due to the loss in accuracy.

### Ranges
Ranges are represented as `start..end`, where *start* and *end* can be values of any type.

##### Note:
However, if one wants to iterate over the values in a range, the two extremes must be integers.

##### examples:
{% highlight elixir %}
1..10
10..-10
-100..1000000
'a'..'z'
"a".."z"
{% endhighlight %}

## Other Types

### PIDs
A PID is a reference to a local or remote process. PID of the current process is available by calling the `self` function.

Processes are fundamental to large Elixir/Erlang applications and PIDs are references through which one process can communicate with another process via Message passing.

##### examples:
{% highlight elixir %}
#PID<0.59.0>
#PID<1.123.0>
{% endhighlight %}

## Collection Types
Elixir collections can hold values of any type, including other collections.

### Tuples
Tuple is an ordered collection of values. Once created, a tuple cannot be modified. A tuple is written as a series of values between braces, separated with commas.

##### examples:
{% highlight elixir %}
{1,2,3,4}
{1,4,9,16}
{:ok, "Hello"}
{:ok, false, {:ok, "Hi"}}
{% endhighlight %}

It is pretty common to return tuples from functions since they can be used in pattern matching in powerful ways, one of them being to return multiple values from a function.

### Lists
List is effectively a linked data structure and may either be empty or consist of a head and a tail list. Because of their implementation, lists are easy to traverse linearly, but they are expensive to access in random order.

Lists are also immutable in nature so any mutating action of list will return a new list.

##### examples:
{% highlight elixir %}
[1,2,3,4]
[1,4,9,16]
['h', 'e', 'l', 'l', 'o']
{% endhighlight %}

> TODO: Keyword Lists, Dicts, Maps, Binaries, Regular Expressions

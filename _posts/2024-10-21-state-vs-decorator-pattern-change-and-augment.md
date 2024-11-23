---
title: "State vs Decorator Pattern: A Comprehensive Guide to Behavioral Change and Feature Augmentation"
description: "An in-depth exploration of State and Decorator design patterns with practical implementations,
real-world use cases, and clear pattern comparison guidelines for modern software development"
date: 2024-10-21 23:30
categories: [Design Patterns, Software Architecture]
tags: [state pattern, decorator pattern, design patterns, software architecture, behavioral patterns, structural 
   patterns, oop principles, pattern comparison, software engineering, clean code]
author: shahmal1yev
---

## Overview

Modern software faces complex and constantly changing requirements. Even a small project grows over time, with new 
features added and existing functionality altered. To manage these changes effectively, programmers have sought 
and tested various solutions over the years. One of the most effective solutions that emerged from these efforts is 
Design Patterns.

Design Patterns are not just rules for writing code—they shape the "mindset" of software engineering. Through these 
patterns, we can break down complex problems into simpler, clearer, and more manageable components.

To put it more clearly, they help make our code:

- Testable
- Scalable
- Debuggable

While it is possible to talk more broadly about them, I believe it would be more practical to focus on specific 
approaches instead.

## Get to Know the Patterns More Closely

Patterns are primarily categorized into three different groups. This categorization, as one might expect, serves 
the purpose of providing similar implementations in different situations over code for each group.

### Categories of Patterns

To better understand the categories, let's take a look at their brief definitions and some of the patterns they 
contain.

#### Structural Patterns

As we mentioned earlier, these patterns offer solutions for connecting various components in the most optimal way 
in different situations. They assist us in organizing the "skeleton" of our system in the best possible way 
according to the requirements.

- Adapter Pattern: Acts as a bridge between incompatible interfaces
- Composite Pattern: Organizes objects into a tree structure
- **Decorator Pattern**: Dynamically extends existing functionality

#### Behavioral Patterns

These patterns define how objects in the system "communicate" with each other:

- Observer Pattern: Establishes an "event-response" relationship between objects
- **State Pattern**: Changes the behavior of an object based on its state at runtime
- Strategy Pattern: Allows dynamic changes of algorithms

#### Creational Patterns

These patterns offer best practices for object creation. The topics covered include performance optimization, 
simplifying the object creation process, and other related aspects.

- Factory Method: Delegates the object creation process to subclass(es)
- Singleton: Ensures that only one instance of a class is created
- Builder: Constructs complex objects step by step

## `State` and `Decorator`

Each of these patterns offers excellent solutions on its own, but despite that, in this post, I want to focus on 
analyzing `State` and `Decorator`.

You might have experienced some confusion when you first encountered these two patterns, or maybe comparing them 
has crossed your mind, and you've found yourself reflecting on their differences. This is, of course, just a 
hypothesis, but it's based on my own experience. Perhaps it's because I've spent more time thinking about the 
differences in implementation than in usage.

> Let's recap:
> - **Decorator Pattern**: Dynamically extends existing functionality
> - **State Pattern**: Changes the behavior of an object based on its state at runtime
{: .prompt-warning }

Over time, as I used these patterns in real-world examples, I realized that there is a fundamental difference 
between them, and each one has its own appropriate context where it shines.

Although they may seem similar at first glance, their purposes and places of use are completely different. The 
State pattern focuses on changing the behavior of an object—meaning the object executes the same methods in 
different ways depending on its state (e.g., different behaviors of a payment terminal when accepting money, 
issuing a receipt, or waiting). The Decorator pattern, on the other hand, is used to add functionality to an 
existing object—meaning the object's features are expanded, but the core behavior does not change (e.g., adding 
milk or sugar to a simple coffee).

From a different perspective, the State pattern answers the question "What is the object doing?" in different ways 
depending on the situation, while the Decorator pattern answers "What else can the object do?"

I believe we will better understand this with example implementations in the rest of the article.

### State Pattern: Managing Behavior Change

The **State Pattern** is a pattern that allows an object’s behavior to change as its internal state changes. 
Without this pattern, such changes are typically managed using large `if-else` or `switch` blocks, which make the 
code hard to read and maintain.

#### Components

The State Pattern consists of three main components:

1. **Context**: The main instance that holds and manages the current state
2. **State**: The interface for all possible states
3. **Concrete States**: Implementations of specific states

<img
src="/assets/images/posts/2024-10-21-state-vs-decorator-pattern-change-and-augment/state-2024-11-10-192644.svg"
alt="State Pattern class diagram illustrating Context, State interface, ConcreteStateA, and ConcreteStateB classes."
width="700"
/>

#### Practical Implementation by Real World Example

Let's try to better understand this pattern and its components with a real-world example.

Consider the general process of crossing a border and entering a country.

A citizen or tourist approaches the border control staff and presents their documents. The officer selects an 
option (Citizen or Tourist "verification") before initiating the verification process in the system based on the 
documents.

The process begins, and the system performs the verification/validation process on the documents according to the 
selected option. The result will indicate whether the documents are valid or invalid, transfer certain records to 
other systems, and so on.

Let’s now implement a `BorderControl` abstraction using TypeScript based on this process.

First, we define the interface on which the verification will be conducted:

```typescript
interface Person {
    passportNumber: string
    visaInfo?: {
        expiryDate: Date
    }
}
```

This interface will represent our "Citizen" or "Tourist." For example, it could look like this:

```typescript
const tourist: Person = {
    passportNumber: "xxxx",
    visaInfo: {
        expiryDate: new Date(
            new Date().setFullYear(new Date().getFullYear() + 1)
        )
    }
}
```

In this example, a tourist object is created with a passport number and a visa that is valid for one year from the 
current date.

```typescript
interface VerificationState {
    setContext(context: BorderControl): void
    verify(person: Person): boolean
}
```

This interface plays the role of verification on our `Context`. By implementing this interface, we ensure that the 
classes provide the necessary functionality for the `Context`.

Next, we implement the `Concrete State` classes based on the `State` interface:

```typescript
class CitizenVerification implements VerificationState {
    private context: BorderControl | null = null
    
    setContext(context: BorderControl): void {
        console.log("Context updating")
        this.context = context
        console.log("Context updated")
    }

    verify(person: Person): boolean {
        console.log("Citizen verification started")
        const result: boolean = this.isPassportValid(person)
        console.log("Citizen verification completed", result)

        return result
    }

    private isPassportValid(person: Person): boolean {
        const passportNumber = person.passportNumber

        // ...

        return false
    }
}

class TouristVerification implements VerificationState {
    private context: BorderControl | null = null;

    setContext(context: BorderControl): void {
        this.context = context
    }

    verify(person: Person): boolean {
        console.log("Tourist verification started")
        const result: boolean = this.isVisaExpired(person)
        console.log("Tourist verification completed", result)

        return result

    }

    private isVisaExpired(person: Person): boolean {
        const expiration: Date = person.visaInfo?.expiryDate || new Date;

        return expiration.getTime() > new Date().getTime()
    }
}
```

Our system is nearly ready. Now, let's implement the `Context`:

```typescript
class BorderControl {
    private state: VerificationState
    private person: Person | null = null

    constructor(state: VerificationState | null = null) {
        this.state = state || new CitizenVerification()
    }

    setVerificationType(verificationType: VerificationState): void {
        console.log("Verification type updating")
        this.state = verificationType
        this.state.setContext(this)
        console.log("Verification type updated", verificationType.constructor.name)
    }

    verify(person: Person): boolean {
        console.log("Verification starting")
        const result: boolean = this.state.verify(person)
        console.log("Verification completed")

        return result
    }
}
```

Here, we have the `BorderControl` class, which serves as the `Context` in the State Pattern. It maintains a `state` 
of type `VerificationState`, which can be changed using the `setVerificationType` method. The `verify` method 
delegates the verification process to the current state.

Next, we implement a simple `client` to see how the system works:

```typescript
function officier(person: Person) {
    const verificationType: VerificationState = (person.visaInfo) 
    ? new CitizenVerification()
    : new TouristVerification()

    const borderControl: BorderControl = new BorderControl(verificationType)

    borderControl.verify(person)
    
    console.log("An error occured!")
    console.log("Person: Is there a problem?")
    console.log("Officer: Sorry, my mistake")

    borderControl.setVerificationType(new TouristVerification())

    const result = borderControl.verify(person)

    console.log("Officier:", result ? "Welcome to our country" : "Sorry, your visa has expired")
}
```

Finally, we can call the function and observe the result:

```typescript
console.clear();

officier(tourist);
```

I believe this works perfectly. Take a look at the output:

```text
[LOG]: "Verification starting" 
[LOG]: "Citizen verification started" 
[LOG]: "Citizen verification completed",  false 
[LOG]: "Verification completed" 
[LOG]: "An error occured!" 
[LOG]: "Person: Is there a problem?" 
[LOG]: "Officer: Sorry, my mistake" 
[LOG]: "Verification type updating" 
[LOG]: "Verification type updated",  "TouristVerification" 
[LOG]: "Verification starting" 
[LOG]: "Tourist verification started" 
[LOG]: "Tourist verification completed",  true 
[LOG]: "Verification completed" 
[LOG]: "Officier:",  "Welcome to our country"
```
#### Advantages of the State Pattern

As we saw in our example, the **State Pattern** provides the following benefits to our system:

1. **Easy to Add New Verification Types**: We can easily introduce new verification types by implementing new 
   concrete states without affecting the existing code.
2. **Keeps Logic for Each Verification Type Separate and Clean**: Each verification type is encapsulated in its own 
   class, making the logic for each verification process clear and manageable.
3. **Manages Transitions Between Verification Types Safely**: The state transitions are controlled, ensuring that 
   switching between different verification types happens in a safe and structured manner.
4. **Avoids Large `if-else` Blocks**: It eliminates the need for messy `if-else` or `switch` statements, making the 
   code easier to read and maintain.

For a more real-world example, I would recommend checking out the [implementation I did on an SDK](https://github.com/shahmal1yev/blueskysdk/blob/main/src/Traits/Smith.php). I particularly appreciate how the `Smith` trait 
operates, but I believe it should be modified since tracking the code becomes harder for IDEs and other tools.

Honestly, the **State Pattern** could be an excellent solution for this. With it, we would not only resolve the 
issue of code tracking, but also manage the system's behavior in a more structured way, making the code easier to 
maintain and extend in the long run.

### Decorator Pattern: Dynamic Extension of Functionality

The **Decorator Pattern** is a structural pattern that allows new functionalities to be added to existing objects 
at runtime. This pattern provides an alternative to inheritance and offers a more flexible solution.

#### Components

The **Decorator Pattern** consists of four main components:

1. **Component**: The base interface that defines the common functionality.
2. **Concrete Component**: The implementation of the base component.
3. **Decorator**: The base class for the decorators that will extend functionality.
4. **Concrete Decorator**: The implementation of specific extensions to the component's functionality.

These components work together to enable dynamic and modular extensions of behavior without modifying the 
underlying object structure, ensuring that the original object's functionality can be enriched or altered at runtime.

<img
src="/assets/images/posts/2024-10-21-state-vs-decorator-pattern-change-and-augment/decorator-2024-11-10-192011.svg"
width="700"
alt="Decorator Pattern class diagram illustrating Component, ConcreteComponent, Decorator, ConcreteDecoratorA, and 
ConcreteDecoratorB classes."
/>


#### Practical Implementation by Real-World Example

Let’s take a different technology and real-world example to better understand the **Decorator Pattern** and its 
components.

One of the key qualities of a good barista in a coffee shop is the ability to prepare coffee according to the 
customer's taste. Initially, baristas learn standard recipes, but as they gain more experience, they expand their 
skills by creating various combinations, different add-ons, and non-standard recipes.

Imagine this scenario:

**Customer**: "I want an Americano, but with less milk and caramel syrup and cream added." **Barista**: "Sure! I 
will prepare a less-milky Americano with caramel syrup and cream."

As you can see, additional ingredients (add-ons) are added to the base drink (Americano) according to the 
customer’s preferences. Each add-on modifies both the price and the composition of the drink. This is exactly how 
the **Decorator Pattern** works — adding new features (add-ons) to an existing object (coffee).

Let’s model this system in Java. First, let’s think through the requirements:

- Every coffee should have a description and a price.
- Add-ons should change both the description and the price of the coffee.
- Add-ons should be able to be added in any sequence and quantity.
- The system should be easily extendable to accommodate new coffee types and add-ons.

Let’s start by creating our basic component:

```java
// Base Component interface
interface Coffee {
    String getDescription();
    double getCost();
}

// Concrete Component
class SimpleCoffee implements Coffee {
    private final String type;
    private final double basePrice;

    public SimpleCoffee(String type, double basePrice) {
        this.type = type;
        this.basePrice = basePrice;
    }

    @Override
    public String getDescription() {
        return type + " Coffee";
    }

    @Override
    public double getCost() {
        return basePrice;
    }
}
```

Now let’s create the decorators:

```java
// Base Decorator
abstract class CoffeeDecorator implements Coffee {
    protected Coffee coffee;

    public CoffeeDecorator(Coffee coffee) {
        this.coffee = coffee;
    }

    @Override
    public String getDescription() {
        return coffee.getDescription();
    }

    @Override
    public double getCost() {
        return coffee.getCost();
    }
}

// Concrete Decorators
class MilkDecorator extends CoffeeDecorator {
    private final String milkAmount;

    public MilkDecorator(Coffee coffee, String milkAmount) {
        super(coffee);
        this.milkAmount = milkAmount;
    }

    @Override
    public String getDescription() {
        return coffee.getDescription() + " + " + milkAmount + " milk";
    }

    @Override
    public double getCost() {
        double cost = 0.5;
        if (milkAmount.equals("low")) cost = 0.2;
        else if (milkAmount.equals("high")) cost = 0.8;
        return coffee.getCost() + cost;
    }
}

class SyrupDecorator extends CoffeeDecorator {
    private final String syrupType;

    public SyrupDecorator(Coffee coffee, String syrupType) {
        super(coffee);
        this.syrupType = syrupType;
    }

    @Override
    public String getDescription() {
        return coffee.getDescription() + " + " + syrupType + " syrup";
    }

    @Override
    public double getCost() {
        return coffee.getCost() + 1.0;
    }
}

class WhippedCreamDecorator extends CoffeeDecorator {
    public WhippedCreamDecorator(Coffee coffee) {
        super(coffee);
    }

    @Override
    public String getDescription() {
        return coffee.getDescription() + " + whipped cream";
    }

    @Override
    public double getCost() {
        return coffee.getCost() + 0.7;
    }
}

class SeasonalToppingDecorator extends CoffeeDecorator {
    private final String season;

    public SeasonalToppingDecorator(Coffee coffee, String season) {
        super(coffee);
        this.season = season;
    }

    @Override
    public String getDescription() {
        return coffee.getDescription() + " + " + season + " topping";
    }

    @Override
    public double getCost() {
        return season.equals("Summer") ? coffee.getCost() * 0.8 : coffee.getCost() + 1.0;
    }
}
```

Finally, let’s see how it can be used:

```java
class CoffeeShop {
    public static void main(String[] args) {
        DecimalFormat df = new DecimalFormat("0.00");

        System.out.println("Customer's order:");
        Coffee americano = new SimpleCoffee("Americano", 2.0);
        americano = new MilkDecorator(americano, "low"); // low milk
        americano = new SyrupDecorator(americano, "Caramel");
        americano = new WhippedCreamDecorator(americano);

        System.out.println("Prepared drink: " + americano.getDescription());
        System.out.println("Price: " + df.format(americano.getCost()) + " AZN\n");

        System.out.println("Summer Campaign Offer:");
        Coffee latte = new SimpleCoffee("Latte", 3.0);
        latte = new MilkDecorator(latte, "medium");
        latte = new SeasonalToppingDecorator(latte, "Summer");

        System.out.println("Prepared drink: " + latte.getDescription());
        System.out.println("Price: " + df.format(latte.getCost()) + " AZN");
    }
}
```

Let’s check the output:

```text
Customer's order:
Prepared drink: Americano Coffee + low milk + Caramel syrup + whipped cream
Price: 3.90 AZN

Summer Campaign Offer:
Prepared drink: Latte Coffee + medium milk + Summer topping
Price: 2.80 AZN
```

As seen in this implementation, the **Decorator Pattern** provides the following benefits:

1. **Control over the quantity of additions** (e.g., milk amount).
2. **Offering different variants** (e.g., regular or extra whipped cream).
3. **Creating seasonal campaigns** (e.g., summer discounts).
4. **Adding new enhancements** easily.

The greatest strength of the pattern in real-world applications lies in its ability to quickly adapt to changing 
business requirements. A new trend or customer request? Simply add a new decorator. A price change? A small 
adjustment in the corresponding decorator is all that’s needed.

This flexibility makes the **Decorator Pattern** extremely useful in dynamic and evolving business environments. 
Whether it’s offering personalized options, adjusting pricing, or rolling out new features, decorators allow 
businesses to scale and adapt without major changes to the underlying system.

#### Advantages of the Decorator Pattern

As we saw in our example, the Decorator pattern allows our system to:

- Dynamically add new functionalities to objects at runtime
- Keep each added functionality separate and clean
- Combine functionalities in any combination
- Extend the system without complicating the inheritance hierarchy
- Add new features without changing implementations

## Patterns in Practice

### When to Use State Pattern

✅ Use it when:

- The behavior of an object changes completely based on its state
- State transitions are managed by complex rules
- It's necessary to separate state-dependent code

❌ Do not use it when:

- The state changes are simple and based on flags/enums
- There are few and stable states
- State changes occur rarely

### When to Use Decorator Pattern

✅ Use it when:

- You need to add functionality dynamically at runtime
- The inheritance hierarchy becomes complex
- You require different combinations of functionality

❌ Do not use it when:

- The functionality is static
- There are few stable combinations
- The components are tightly coupled

## Pattern Comparison Table

Finally, I would like to conclude the article with a small comparison table along with some reference links.

I hope this article has been helpful to you, and I would love to hear your thoughts in the comments section. 
Looking forward to seeing you in the next post.

| Aspect          | State Pattern      | Decorator Pattern         |
|-----------------|--------------------|---------------------------|
| **Purpose**     | Change behavior    | Add functionality         |
| **Focus**       | Internal state     | External functionality    |
| **Modification**| Complete behavior  | Incremental additions     |
| **Composition** | One state          | Multiple decorators       |
| **Extension**   | New states         | New decorators            |
| **Relation**    | is-in-state        | has-additional-feature    |

## References

- [GoF Design Patterns](https://www.amazon.com/Design-Patterns-Elements-Reusable-Object-Oriented/dp/0201633612)
- [State - Refactoring Guru](https://refactoring.guru/design-patterns/state)
- [Decorator - Refactoring Guru](https://refactoring.guru/design-patterns/decorator)


<iframe
src="https://github.com/sponsors/shahmal1yev/button"
title="Sponsor shahmal1yev"
height="32"
width="100%"
style="border: 0; border-radius: 6px;margin: 0 auto;"></iframe>
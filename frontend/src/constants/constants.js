// Versions des langages supportés
export const LANGUAGE_VERSIONS = {
	javascript: "18.15.0",
	typescript: "5.0.3",
	python: "3.10.0",
	java: "15.0.2",
	csharp: "6.12.0",
	php: "8.2.3",
	cpp: "10.2.0",
	c: "10.2.0",
	go: "1.16.2",
	rust: "1.68.2",
	ruby: "3.0.1",
	swift: "5.3.3",
	kotlin: "1.8.20",
	scala: "3.2.2",
	r: "4.2.0",
	sql: "3.36.0",
};

// Snippets de code par défaut pour chaque langage
export const CODE_SNIPPETS = {
	javascript: `function greet(name) {
  console.log("Bonjour, " + name + " !");
}

greet("Monde");`,

	typescript: `type Params = {
  name: string;
}

function greet(data: Params) {
  console.log("Bonjour, " + data.name + " !");
}

greet({ name: "TypeScript" });`,

	python: `def greet(name):
    print(f"Bonjour, {name} !")

greet("Python")`,

	java: `public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Bonjour, Java !");
    }
}`,

	csharp: `using System;

namespace HelloWorld
{
    class Hello {         
        static void Main(string[] args)
        {
            Console.WriteLine("Bonjour, C# !");
        }
    }
}`,

	php: `<?php

function greet($name) {
    echo "Bonjour, " . $name . " !";
}

greet("PHP");`,

	cpp: `#include <iostream>

int main() {
    std::cout << "Bonjour, C++ !" << std::endl;
    return 0;
}`,

	c: `#include <stdio.h>

int main() {
    printf("Bonjour, C !\\n");
    return 0;
}`,

	go: `package main

import "fmt"

func main() {
    fmt.Println("Bonjour, Go !")
}`,

	rust: `fn main() {
    println!("Bonjour, Rust !");
}`,

	ruby: `def greet(name)
  puts "Bonjour, #{name} !"
end

greet("Ruby")`,

	swift: `import Swift

func greet(name: String) {
    print("Bonjour, \\(name) !")
}

greet(name: "Swift")`,

	kotlin: `fun main() {
    println("Bonjour, Kotlin !")
}`,

	scala: `object HelloWorld {
  def main(args: Array[String]): Unit = {
    println("Bonjour, Scala !")
  }
}`,

	r: `greet <- function(name) {
  cat("Bonjour,", name, "!\\n")
}

greet("R")`,

	sql: `SELECT 'Bonjour, SQL !' AS message;`,
};

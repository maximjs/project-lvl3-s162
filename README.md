[![Maintainability](https://api.codeclimate.com/v1/badges/f900e9c918d6442bdd0f/maintainability)](https://codeclimate.com/github/maximjs/project-lvl3-s162/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/f900e9c918d6442bdd0f/test_coverage)](https://codeclimate.com/github/maximjs/project-lvl3-s162/test_coverage)
[![Build Status](https://travis-ci.org/maximjs/project-lvl3-s162.svg?branch=master)](https://travis-ci.org/maximjs/project-lvl3-s162)

Установка:
```
$ npm install page-loader-utility
```

Запуск:
```
$ page-loader [options] <http address>
```
\<http address\> - полный адрес с указанием протокола (http://...)

Options:  
* -V --version, display the version number
* -h --help, output usage information
* -o --output, output directory

Использовались: npm, babel, eslint, тесты - jest.  
В рамках проекта было необходимо реализовать утилиту для скачивания указанного адреса из сети. Принцип ее работы очень похож на то, что делает браузер при сохранении страниц сайтов.

Затронутые темы:
* Тестирование с использованием Mock/Stub
* Активный файловый ввод/вывод
* Работа с ошибками и исключениями
* Знакомство с модулями nodejs: os, path, fs, url
* Работа с DOM. Базовые манипуляции
* Асинхронный код: Promises, Async/Await
* Работа с HTTP


Пример использования:
```
$ page-loader --output ./tmp https://hexlet.io/courses
> Saving page https://hexlet.io/courses
  | Downloading
✔  Page https://hexlet.io/courses is successfully loaded

✔  File https://cdn2.hexlet.io/assets/application-b7be9f361552c63ed71e93ffc3e59a01703825afea41ff93b20f9988bfb5c9fb.css is successfully loaded
✔  File https://cdn2.hexlet.io/assets/icons/default/favicon-8fa102c058afb01de5016a155d7db433283dc7e08ddc3c4d1aef527c1b8502b6.ico is successfully loaded
✔  File https://cdn2.hexlet.io/assets/icons/default/favicon-196x196-422632c0ef41e9b13dd7ea89f1764e860d225ca3c20502b966a00c0039409a75.png is successfully loaded

...

✔  File https://polyfill.io/v2/polyfill.min.js is successfully loaded
✔  File https://cdn2.hexlet.io/assets/essential-e3a0d493664e520f164910722816c0b9d07f2b964ced09a7af40648df08c5086.js is successfully loaded
√ Saving page https://hexlet.io/courses
```

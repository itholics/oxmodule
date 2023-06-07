# [ITholics'](https://www.itholics.de) oxmodule

## Introduction

Helper to create module (v2.1) skeleton for [oXID](https://www.oxid-esales.com/) written for NodeJS.

## Usage
You may install it globally:

    npm install -g oxmodule
    oxmodule

or better:
    
    npx oxmodule

If the module structure is like:
- modules
  - vendor
    - module_name1
    - module_name2
  
You will be asked for the installation path (defaults to current directory). You can provide the `modules/` or `modules/vendor/` if 
the target-directory is f.e. `vendor/module_name3`. Tt will add the module_name3 to the vendor folder.
If the vendor das not exist, you must provide the `modules/` folder.

In the process of creation it will ask you some questions about the module you like to create:
- composer naming
- target directory naming
- module id
- etc...

You should be in the `<SHOP>/source/modules` or `<SHOP>/source/modules/<YOUR_VENDOR>` directory or providing this directory in the process.

## Skeleton
- `TARGET_VENDOR`
    - `TARGET_NAME`
      - Application
        - Component
          - Widget
        - Controller
          - Admin
        - Core
          - Module.php
        - Model
        - translations (optional)
          - de
            - `ID`_de_lang.php
          - en
            - `ID`_en_lang.php
          - es
            - `ID`_es_lang.php
          - fr
            - `ID`_fr_lang.php
          - it
            - `ID`_it_lang.php
        - views
          - admin (oxid `<7`)
            - de
              - `ID`_admin_de_lang.php
            - en
              - `ID`_admin_en_lang.php
            - tpl
          - admin_smarty (oxid `>=7`)
            - de
              - `ID`_admin_de_lang.php
            - en
              - `ID`_admin_en_lang.php
            - tpl
          - admin_twig (oxid `>=7`)
            - de
              - `ID`_admin_de_lang.php
            - en
              - `ID`_admin_en_lang.php
            - tpl
          - blocks
          - tpl
      - bin
        - install.sh
        - update.sh
        - remove.sh
      - docs
      - out (oxid `<7`)
      - assets (oxid `>=7`)
      - Smarty
      - composer.json
      - metadata.php
      - README.md

## Changelog
[View Changelog here.](./CHANGELOG.md)
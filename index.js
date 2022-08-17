#!/usr/bin/env node
const prompter = require('prompt-sync')()
const path = require('path')
const fs = require('fs')

const ENCODING = 'utf8'

function prompt(what) {
  let res = prompter(what);
  if (null === res) {
    process.emit('SIGINT')
  }
  return res;
}

function template(p) {
  return path.resolve(__dirname, p)
}


function getComposerName() {
  const name = prompt('Composer name <vendor>/<name>: ').trim()
  const parts = name.split('/').filter(n => n.trim())
  if (2 !== parts.length) {
    console.warn('Naming incorrect, please re-enter')
    return getComposerName()
  }
  return [parts[0], parts[1], parts.join('/')]
}

function getTargetDir(c) {
  const target = prompt(`Target directory <vendor>/<name> (default="${c}"): `).trim() || c
  const parts = target.split('/').filter(n => n.trim())
  if (2 !== parts.length) {
    console.warn('Naming incorrect, please re-enter')
    return getTargetDir(c)
  }
  return [parts[0], parts[1], parts.join('/')]
}

function getModuleId(...names) {
  console.info('Module ID: list of possible IDs')
  for (let i in names) {
    const name = names[i]
    console.info(`${name}: [${i}]`)
  }
  const val = prompt('Module ID (choose a number or enter own): ').trim()
  if (!isNaN(parseInt(val))) {
    if (names[parseInt(val)]) {
      return names[parseInt(val)]
    }
  }
  if (!val) {
    console.warn('No sufficient value given, please retry')
    return getModuleId(...names)
  }
  return val
}

function getModulePath(vendor, name) {
  let p = prompt('Use path without module path name (default=.): ') || '.'
  p = path.resolve(p)
  let v = p.split(path.sep).pop()
  if (v !== vendor) {
    p = path.resolve(p, vendor, name)
  } else {
    p = path.resolve(p, name)
  }
  return p
}

function getVersion() {
  return prompt('Version (default="1.0.0"): ').trim() || '1.0.0'
}

function getAuthor() {
  return [prompt('Author name (empty for none): ').trim(), prompt('Author email (empty for none): ').trim()]
}

function getNamespace() {
  const val = prompt('Namespace to root (seperated by space): ').trim()
  if (!val) {
    console.warn('Missing value, please re-enter')
    return getNamespace()
  }
  const arr = val.split(/\s+/).filter(n => n.trim())
  const full = arr.join('\\\\')
  return [full, arr]
}

function updateData(str, data) {
  return str.replace(/__VENDOR__/g, data.cvender)
    .replace(/__MODULE__/g, data.cname)
    .replace(/__TVENDOR__/g, data.tvendor)
    .replace(/__TMODULE__/g, data.tname)
    .replace(/__ID__/g, data.id)
    .replace(/__VERSION__/g, data.version)
    .replace(/__NAMESPACE__/g, data.namespace + '\\\\')
    .replace(/__AUTHORNAME__/g, data.aName)
    .replace(/__AUTHORMAIL__/g, data.aMail)
    .replace(/__ROOTNAMESPACE__/g, data.namespaces.join('\\'))
}

function setupRoot(data) {
  console.info(`Setting up module path: ${data.path}`)
  if (!fs.existsSync(data.path)) {
    fs.mkdirSync(data.path, {recursive: true})
  } else {
    throw new Error('Path/Module already exists!')
  }
}

function setupBin(data) {
  console.info('Setting up /bin')
  let dir = path.resolve(data.path, 'bin')
  console.info(`Path is: ${dir}`)
  if (!fs.existsSync(dir)) {
    console.info(`/bin path does not exists and will be added...`)
    fs.mkdirSync(dir, {recursive: true})
  }
  // bootstrap.php
  let file = fs.readFileSync(template('templates/bin.bootstrap.php.txt'), ENCODING).toString()
  let wfile = path.resolve(dir, 'bootstrap.php')
  console.info(`Writing "bootstrap.php" to ${wfile} ...`)
  fs.writeFileSync(wfile, file, ENCODING)
  // install.sh
  file = fs.readFileSync(template('templates/bin.install.sh.txt'), ENCODING).toString()
  file = updateData(file, data)
  wfile = path.resolve(dir, 'install.sh')
  console.info(`Writing "install.sh" to ${wfile} ...`)
  fs.writeFileSync(wfile, file, ENCODING)
  // remove.sh
  file = fs.readFileSync(template('templates/bin.remove.sh.txt'), ENCODING).toString()
  file = updateData(file, data)
  wfile = path.resolve(dir, 'remove.sh')
  console.info(`Writing "remove.sh" to ${wfile} ...`)
  fs.writeFileSync(wfile, file, ENCODING)
  // update.sh
  file = fs.readFileSync(template('templates/bin.update.sh.txt'), ENCODING).toString()
  file = updateData(file, data)
  wfile = path.resolve(dir, 'update.sh')
  console.info(`Writing "update.sh" to ${wfile} ...`)
  fs.writeFileSync(wfile, file, ENCODING)
}

function setupComposer(data) {
  console.info(`Setting up composer.json`)
  let file = fs.readFileSync(template('templates/composer.json.txt'), ENCODING)
  file = updateData(file, data)
  if (data.aName || data.aMail) {
    let author = []
    if (data.aName) {
      author.push(`"name": "${data.aName}"`)
    }
    if (data.aMail) {
      author.push(`"email": "${data.aMail}"`)
    }
    author = `{${author.join(', ')}}`
    file = file.replace(/__AUTHOR__/g, author)
  } else {
    file = file.replace(/__AUTHOR__/g, '')
  }
  const wfile = path.resolve(data.path, 'composer.json')
  console.info(`Writing "composer.json to ${wfile}"`)
  fs.writeFileSync(wfile, file, ENCODING)
}

function setupMetadata(data) {
  console.info('Setting update metadata.php')
  let file = fs.readFileSync(template('templates/metadata.php.txt'), ENCODING)
  file = updateData(file, data)
  const namespace = [...data.namespaces, 'Application', 'Core', 'Module'].join('\\')
  file = file.replace(/__CORENAMESPACE__/g, namespace)
  const wfile = path.resolve(data.path, 'metadata.php')
  console.info(`Writing "metadata.php" to ${wfile}`)
  fs.writeFileSync(wfile, file, ENCODING)
}

function setupCoreModule(data) {
  console.info('Setup Application\\Core\\Module')
  const dir = path.resolve(data.path, 'Application', 'Core')
  console.info(`Creating Core-Application folder: ${dir}`)
  fs.mkdirSync(dir, {recursive: true})
  let file = fs.readFileSync(template('templates/Application.Core.Module.php.txt'), ENCODING)
  file = updateData(file, data)
  const wfile = path.resolve(dir, 'Module.php')
  console.info(`Writing "Module.php" to ${wfile}`)
  fs.writeFileSync(wfile, file, ENCODING)
}

function setupFolders(data) {
  const dirs = [
    path.resolve(data.path, 'Application', 'Controller', 'Admin'),
    path.resolve(data.path, 'Application', 'Component', 'Widget'),
    path.resolve(data.path, 'Application', 'Model'),
    path.resolve(data.path, 'Application', 'views', 'admin', 'tpl'),
    path.resolve(data.path, 'Application', 'views', 'blocks'),
    path.resolve(data.path, 'Application', 'views', 'tpl'),
    path.resolve(data.path, 'docs'),
    path.resolve(data.path, 'out'),
    path.resolve(data.path, 'Smarty', 'Plugin'),
  ]
  for (let dir of dirs) {
    console.info(`Making folder structure: ${dir}`)
    fs.mkdirSync(dir, {recursive: true})
  }
  
}

function setupAdminTranslations(data) {
  const info = [
    ['de', 'Deutsch'],
    ['en', 'English']
  ]
  for (let [lang, full] of info) {
    const dir = path.resolve(data.path, 'Application', 'views', 'admin', lang)
    const wfile = path.resolve(data.path, 'Application', 'views', 'admin', lang, `${data.id}_admin_${lang}_lang.php`)
    let file = fs.readFileSync(template('templates/Application.views.admin.lang.php.txt'), ENCODING).replace(/__NAME__/g, full)
    console.info(`Setting up admin language "${full}" to ${wfile}`)
    !fs.existsSync(dir) && fs.mkdirSync(dir, {recursive: true})
    fs.writeFileSync(wfile, file, ENCODING)
  }
}

function setupTranslations(data) {
  console.info('\nChoose an option for setting up translations')
  const t = {
    de: 'Deutsch',
    en: 'English',
    it: 'Italiano',
    es: 'Español',
    fr: 'Français'
  }
  let opt = ['None (n)']
  for (const [s, f] of Object.entries(t)) {
    opt.push(`${f} (${s})`)
  }
  opt.push('All (empty/default)')
  opt = opt.join('\n')
  console.info(opt)
  let response = prompt('Select your options: "de en" (separated by space): ').trim().toLowerCase()
  if ('n' === response) {
    console.info('No translations will be installed')
    return
  }
  opt = []
  if ('' === response) {
    opt = Object.keys(t)
  } else {
    for (let action of response.split(/\s+/)) {
      if (action in t) {
        opt.push(action)
      }
    }
  }
  if (!opt.length) {
    console.info('No translations will be installed (invalid selection)')
    return
  }
  for (let lang of opt) {
    const full = t[lang]
    const dir = path.resolve(data.path, 'Application', 'translations', lang)
    const wfile = path.resolve(data.path, 'Application', 'translations', lang, `${data.id}_${lang}_lang.php`)
    const file = fs.readFileSync(template('templates/Application.views.admin.lang.php.txt'), ENCODING).replace(/__NAME__/g, full)
    console.info(`Writing translation ${full} (${lang}) to ${wfile}`)
    !fs.existsSync(dir) && fs.mkdirSync(dir, {recursive: true})
    fs.writeFileSync(wfile, file, ENCODING)
  }
}

function setupReadme(data) {
  console.info('Writing README.md')
  const wfile = path.resolve(data.path, 'README.md')
  fs.writeFileSync(wfile, `# ${data.cfull}\n`, ENCODING)
}

function setup(data) {
  setupRoot(data)
  setupBin(data)
  setupFolders(data)
  setupComposer(data)
  setupMetadata(data)
  setupCoreModule(data)
  setupAdminTranslations(data)
  setupTranslations(data)
  setupReadme(data)
}

function main() {
  const [_cvendor, _cname, _cfull] = getComposerName()
  const [_tvendor, _tname, _tfull] = getTargetDir(_cfull)
  const _idList = [_cname]
  if (_cname !== _tname) {
    _idList.push(_tname)
  }
  const _id = getModuleId(..._idList)
  const _path = getModulePath(_tvendor, _tname)
  console.info(`Current data till now: composer="${_cfull}" target-dir="${_tfull}" id="${_id}" path="${_path}"`)
  
  const _version = getVersion()
  const [_aName, _aMail] = getAuthor()
  const [_namespace, _namespaces] = getNamespace()
  console.info(`Values: version="${_version}" author="${_aName}" email="${_aMail}" namespace="${_namespace}"`)
  if (prompt('Do you want to process and creating the files? (default=yes, anythink=no): ')) {
    console.info('Aborted by user')
    return
  }
  const data = {
    cvender: _cvendor,
    cname: _cname,
    cfull: _cfull,
    tvendor: _tvendor,
    tname: _tname,
    tfull: _tfull,
    id: _id,
    path: _path,
    version: _version,
    aName: _aName,
    aMail: _aMail,
    namespace: _namespace,
    namespaces: _namespaces
  }
  setup(data)
}

function interruptHandler() {
  if (process.platform === 'win32') {
    const rl = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    }).on('SIGINT', function() {
      process.emit('SIGINT')
    })
  }
  process.on('SIGINT', function() {
    console.info('User aborted...')
    process.exit()
  })
}

if (require.main === module) {
  interruptHandler()
  main()
  process.exit()
}

const generator = require('generate-password')

module.exports = function generate(type) {
  const generatedValue = generator.generate({
    length: type === "password" ? 10 : 20, 
    numbers: true,
    symbols: true,
    uppercase: true,
    exclude: '{},.:;[]()$"/\\~^',
    excludeSimilarCharacters: true
  })

  if (type === 'recovery_key') return `${generatedValue}_exc_key`

  return generatedValue
}
    
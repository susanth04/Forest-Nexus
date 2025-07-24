function suggestPet(req, res) {
  const { space, salary, timeAvailable, grooming, animal } = req.body;

  let suggestions = [];

  if (animal === 'Dog') {
    if (timeAvailable === 'high' && grooming === 'low') {
      suggestions.push('Labrador Retriever', 'Beagle');
    } else if (timeAvailable === 'low') {
      suggestions.push('Pug', 'Chihuahua');
    }
  } else if (animal === 'Cat') {
    suggestions.push('Siamese', 'Persian');
  } else {
    suggestions.push('Rabbit', 'Parrot');
  }

  return res.json({ suggestions });
}

module.exports = { suggestPet };

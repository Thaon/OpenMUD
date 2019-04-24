# OpenMUD
an externally managed MUD server / client that runs off of PasteBin


in order to create a world, create a new JSON object in a pastebin, you can use the following structure:

{
"rooms": [
  {
    "name": "City Hall",
    "description": "The hall is a vast and empty room, filled with old unintellegible paper scraps and not much else.",
    "north": null,
    "east": null,
    "south": "Main Street",
    "west": null
  },
  {
    "name": "Main Street",
    "description": "Just in front of the city hall, a long road stretches from East to West, who knows where it could lead you...",
    "north": "City Hall",
    "east": null,
    "south": null,
    "west": null
  }
],
"cards": [
  {
    "title": "Example card",
    "content": "this is what is written on the first card"
  },
  {
    "title": "Example card 2",
    "content": "this is what is written on the second card"
  }
]
}

commands:
login + world ID + name, logs you into a world with the given name
travel + direction, travels in a direction
describe area, describes the area around you
roll + number, rolls a dice with that many faces
draw card, draws a card from the global deck for this world

that's it for now.
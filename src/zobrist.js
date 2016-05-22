const cache = {};

function initialBitstringFor(size, y, x, value) {
  cache[size]       = cache[size] || {};
  cache[size][y]    = cache[size][y] || {};
  cache[size][y][x] = cache[size][y][x] || {};

  if (cache[size][y][x][value]) {
    return cache[size][y][x][value];
  }

  // The number of legal 19x19 go moves is on the order of 10^170 ≈ 2^565, so
  // a hash output on the order of 2^31 is woefully insufficient for arbitrary
  // positions, but it should be good enough for human play, since we're not
  // searching the entire space. This should be good enough for ~300-move games.
  const randomValue = Math.floor(Math.random() * (Math.pow(2, 31) - 1));
  cache[size][y][x][value] = randomValue;

  return randomValue;
}

export default {
  hash: function(boardSize, intersections) {
    let h = 0;

    intersections.forEach(i => {
      if (!i.isEmpty()) {
        const initial = initialBitstringFor(boardSize, i.y, i.x, i.value);
        h = h ^ initial;
      }
    });

    return h;
  }
};

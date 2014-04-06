// http://bl.ocks.org/aubergene/7791133

// This is a function
function Normalizer(min, max) {
  return function(val) {
    return (val - min) / (max - min);
  }
}

// This is another
function Interpolater(min, max, clamp) {
  return function(val) {
    val = min + (max - min) * val;
    return clamp ? Math.min(Math.max(val, min), max) : val;
  }
}

// This is a third
function Scale(minDomain, maxDomain, minRange, maxRange, clamp) {
  var normalize = new Normalizer(minDomain, maxDomain);
  var interpolate = new Interpolater(minRange, maxRange, clamp);
  var _normalize = new Normalizer(minRange, maxRange);
  var _interpolate = new Interpolater(minDomain, maxDomain, clamp);
  var s = function(val) {
    return interpolate(normalize(val));
  };
  s.inverse = function(val) {
    return _interpolate(_normalize(val));
  };
  return s;
}
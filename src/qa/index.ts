// Separate entry: diagnostic fixtures never enter the game build.
if (new URLSearchParams(location.search).has("art-load")) {
  void import("./art-load");
} else if (new URLSearchParams(location.search).has("lifecycle")) {
  void import("./lifecycle");
} else {
  void import("./benchmark");
}

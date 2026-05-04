{
  description = "Candela docs — Astro Starlight";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_22
            git
          ];

          shellHook = ''
            echo "🕯️ Candela Docs dev shell (Starlight)"
            echo "  Run: npm install && npm run dev"
          '';
        };
      });
}

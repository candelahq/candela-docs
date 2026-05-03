{
  description = "Candela Docs - MkDocs Material documentation site";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
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
            python312
            uv
            git
          ];

          shellHook = ''
            echo "🕯️ Candela Docs dev shell"
            echo "  Run: uv sync && uv run mkdocs serve"
          '';
        };
      }
    );
}

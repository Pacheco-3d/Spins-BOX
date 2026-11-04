"""Build the complete offline distribution using only the Python standard library."""
from pathlib import Path
from shutil import copyfile
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
standalone = root / "dist/Spins-BOX.html"
if not standalone.is_file():
    raise SystemExit("Execute npm run export antes de empacotar.")

(root / "offline").mkdir(exist_ok=True)
copyfile(standalone, root / "offline/JOGAR.html")
(root / "downloads").mkdir(exist_ok=True)
output = root / "downloads/Spins-BOX-completo-offline.zip"
guide = """SPINS-BOX 3D — PACOTE COMPLETO OFFLINE

COMO JOGAR
1. Extraia o ZIP inteiro para uma pasta.
2. Abra JOGAR.html em um navegador com WebGL 2 (Chrome, Edge ou equivalente).
3. Não precisa instalar Node.js nem conectar à internet para jogar.
4. O ícone ? abre o tutorial. No computador, use as setas ou WASD.
   Em telas de toque, deslize um dedo sobre o tabuleiro.

Inclui 40 fases, avanço automático, apoio parcial do bloco, planos revelados
por etapas e um novo mundo azul com desafios avançados após a fase 20.
O progresso fica salvo no navegador; ele não é transportado pelo ZIP.

CONTEÚDO
- JOGAR.html: jogo completo, incluindo a biblioteca 3D e os materiais.
- codigo-fonte/: mapas, código, testes, documentação, licenças e dependências.

DESENVOLVIMENTO (OPCIONAL)
As dependências incluídas são do ambiente Linux x64. Elas não são necessárias
para abrir JOGAR.html. O esbuild incluído é para Linux x64; para recompilar em
outro sistema, instale as dependências correspondentes com npm ci.
Isso não afeta a edição HTML já compilada, que funciona offline.
O empacotamento usa Python 3; jogar não requer Python.
"""
files = [".gitignore", ".gitattributes", "README.md", "THIRD_PARTY_NOTICES.md", "index.html",
         "package.json", "package-lock.json", "server.mjs"]
with ZipFile(output, "w", ZIP_DEFLATED, compresslevel=9) as archive:
    archive.writestr("Spins-BOX-offline/LEIA-ME.txt", guide)
    archive.write(standalone, "Spins-BOX-offline/JOGAR.html")
    for name in files:
        archive.write(root / name, "Spins-BOX-offline/codigo-fonte/" + name)
    for folder in ["src", "tests", "scripts", "dist", "node_modules"]:
        for file in sorted((root / folder).rglob("*")):
            if file.is_file() and "__pycache__" not in file.parts and ".cache" not in file.parts:
                archive.write(file, "Spins-BOX-offline/codigo-fonte/" + str(file.relative_to(root)))

with ZipFile(output) as archive:
    if archive.testzip() is not None:
        raise SystemExit("Falha na integridade do ZIP.")
    if archive.read("Spins-BOX-offline/JOGAR.html") != standalone.read_bytes():
        raise SystemExit("O HTML do ZIP não corresponde à edição exportada.")
print(f"Pacote verificado: {output.relative_to(root)} ({output.stat().st_size / 1024**2:.1f} MiB)")

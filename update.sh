set -euo pipefail

git checkout master
make clean && make && make test
rm -rf tmp/gh-pages
rsync -avh build examples tmp/gh-pages/
git checkout gh-pages

rm -rf examples/ build/

mv tmp/gh-pages/* ./

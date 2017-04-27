set -euo pipefail

git checkout master
make clean && make && make test
rm -rf tmp/gh-pages
rsync -avh build examples test.html tmp/gh-pages/
git checkout gh-pages

mv tmp/gh-pages/* ./

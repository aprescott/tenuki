set -e

export PATH="./node_modules/.bin:$PATH"

rm -rf lib
rm -rf build
mkdir build

babel --source-maps --presets es2015 src -d lib > /dev/null

cat copyright_header.txt <(browserify index.js --standalone tenuki -t [ babelify --presets [ es2015 ] ]) > build/tenuki.js
cat copyright_header.txt <(uglifyjs build/tenuki.js --mangle) > build/tenuki.min.js
cat copyright_header.txt css/*.css > build/tenuki.css
cat copyright_header.txt <(cat css/*.css | cleancss) > build/tenuki.min.css

export PATH="./node_modules/.bin:$PATH"

cat copyright_header.txt <(browserify index.js --standalone tenuki -t [ babelify --presets [ es2015 ] ]) > build/tenuki.js
cat copyright_header.txt <(uglifyjs build/tenuki.js) > build/tenuki.min.js
cat copyright_header.txt css/*.css > build/tenuki.css
cat copyright_header.txt <(cat css/*.css | cleancss) > build/tenuki.min.css

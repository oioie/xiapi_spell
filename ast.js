const parser = require("@babel/parser");
const traverse = require('@babel/traverse').default;
const generator = require("@babel/generator").default;
const fs = require("fs");
const t = require("@babel/types");
let jsFile = fs.readFileSync("./raw.js","utf-8");
ast = parser.parse(jsFile);
let   decode_JS = generator(ast,{minified:true,jsescOption:{minified: true}}).code
ast = parser.parse(decode_JS) // 代码格式化
window = globalThis
function areAllStringsAndLengthGreaterThanOne(arr) {
    // Check if array length is greater than 1
    if (arr.length <= 1) {
        return false;
    }

    // Use the every method to check if all elements are strings
    return arr.every(element => element.type === 'StringLiteral');
}
let level_1_func_pool = []
traverse(ast,
    // Catch Constant Pool Functions also add globalThis scope by eval
    {
    FunctionDeclaration(path){
        try{
            if(path.node.body.body.length===1){
                if(path.node.body.body[0].type==="ReturnStatement"){
                    if(path.node.body.body[0].argument.type==='ArrayExpression' && areAllStringsAndLengthGreaterThanOne(path.node.body.body[0].argument.elements)){
                        let pool_name = path.node.id.name;
                        level_1_func_pool.push(pool_name);
                        let func_code = generator(path.node).code
                        func_code = `window.${pool_name} = ${func_code}`
                        eval(func_code)
                    }
                }
            }
        }catch (e) {

        }
    }
})
let decode_func_pool = []
traverse(ast,{
    VariableDeclarator(path){
        try{
            if(path.node.init.type==='Identifier'){
                if(level_1_func_pool.includes(path.node.init.name)){
                    let decode_func_name = path.scope.path.node.id.name;
                    decode_func_pool.push(decode_func_name);
                    let func_code = generator(path.scope.path.node).code;
                    func_code = `window.${decode_func_name} = ${func_code}`
                    eval(func_code)
                }
            }

        }catch (e) {

        }
    }
})
traverse(
    ast,{
        VariableDeclarator(path){
            try{
                if(path.node.init.type==='Identifier'){
                    if(decode_func_pool.includes(path.node.init.name)){
                        let func_name = path.node.id.name;
                        let d_func = path.node.init.name
                        path.scope.getBinding(func_name).referencePaths.forEach(
                            p=>{
                                if(p.parent.type==="CallExpression" && p.parent.arguments[0].type=="NumericLiteral"){
                                    let arg1 = p.parent.arguments[0].value;
                                    let res1 = window[d_func](arg1);
                                    console.log(`${func_name}|${arg1} ==> ${res1}`)
                                    p.parentPath.replaceInline(t.stringLiteral(res1))
                                }
                            }
                        )

                    }}
            }catch (e) {

            }
        }
    }
)
let decode = generator(ast).code
fs.writeFile("./pp.js",decode,function (){})
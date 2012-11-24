var Symbol = String;

var env = function (trial) 
{
	var i, e = {}, outer = trial.outer || {};
        
    	var get_outer = function () 
	{
                return outer;
	};
        
    	var find = function (variable) 
	{
                if (e.hasOwnProperty(variable)) 
		{
                        return e;
                } 
		else 
		{
            		return outer.find(variable);
        	}
    	};
    
    	if (0 !== trial.params.length) 
	{
	        for (i = 0; i < trial.params.length; i += 1) 
		{
		        e[trial.params[i]] = trial.args[i];
        	}
    	}

    	e.get_outer = get_outer;
    	e.find = find;
    
    	return e;
}

var add_globals = function (e) 
{
    
	var mathfns = ['abs', 'acos', 'asin', 'atan', 'atan2', 'ceil', 'cos', 'exp', 'floor', 'log', 'max', 'min', 'pow', 'random', 'round', 'sin', 'sqrt', 'tan'], i;

	for (i = 0; i < mathfns.length; i += 1) 
	{
	        e[mathfns[i]] = Math[mathfns[i]];
	}
    	e['+'] = Math.add;
    	e['-'] = Math.sub;
    	e['*'] = Math.mul;
    	e['/'] = Math.div;
    	e['>'] = Math.gt;
    	e['<'] = Math.lt;
    	e['>='] = Math.ge;
    	e['<='] = Math.le;
    	e['='] = Math.eq;
        e['remainder'] = Math.mod;
    	e['equal?'] = Math.eq;
    	e['eq?'] = Math.eq; 
        e['length'] = function (x) { return x.length; };
        e['cons'] = function (x, y) { var arr = [x]; return arr.concat(y); };
    	e['car'] = function (x) { return (x.length !== 0) ? x[0] : null; };
    	e['cdr'] = function (x) { return (x.length > 1) ? x.slice(1) : null; }; 
        e['append'] = function (x, y) { return x.concat(y); };
    	e['list'] = function () { return Array.prototype.slice.call(arguments); }; 
        e['list?'] = function (x) { return x && typeof x === 'object' && x.constructor === Array ; }; 
        e['null?'] = function (x) { return (!x || x.length === 0); };
        e['symbol?'] = function (x) { return typeof x === 'string'; };
    	return e;
}

Math.add = function (a, b) 
{
	return a + b;
}

Math.sub = function (a, b) 
{
	return a - b;
}

Math.mul = function (a, b) 
{
	return a * b;
}

Math.div = function (a, b) 
{
	return a / b;
}

Math.gt = function (a, b) 
{
	return a > b;
}

Math.lt = function (a, b) 
{
	return a < b;
}

Math.ge = function (a, b) 
{
	return a >= b;
}

Math.le = function (a, b) 
{
	return a <= b;
}

Math.eq = function (a, b) 
{
	return a === b;
}

Math.mod = function (a, b) 
{
	return a % b;
}

var global_e = add_globals(env({params: [], args: [], outer: undefined}));

var eval = function (x, e) 
{
        e = e || global_e;
        return ((analyze(x)) (e));
}

var analyze = function (x) 
{
	if (typeof x === 'string') 
	{        
        	return function (e) 
		{ 
			return e.find(x.valueOf())[x.valueOf()];
		}
    	} 
	else if (typeof x === 'number') 
	{ 
        	return function (e) 
		{ 
			return x; 
		}
    	} 
	else if (x[0] === 'quote') 
	{      
                var qval = x[1];
        	return function (e) 
		{ 
			return  qval; 
		}
    	} 
	else if (x[0] === 'if') 
	{         
                return function (pproc, cproc, aproc) 
		{
                        return function (e) 
			{ 
                        	if (pproc(e)) 
				{
                                	return cproc(e);
                                } 
				else 
				{
                                	return aproc(e);
                                }
                        }              
                }
		(analyze(x[1]), analyze(x[2]), analyze(x[3]));
    	} 
	else if (x[0] === 'set!') 
	{                       
                return function (vvar, vproc) 
		{
                        return function (e) 
			{ 
				e.find(vvar)[vvar] = vproc(e); 
			}
                }
		(x[1], analyze(x[2]));
    	}
	else if (x[0] === 'define') 
	{     
                return function (vvar, vproc) 
		{
                        return function (e) 	
			{ 	
				e[vvar] = vproc(e); 
			}
                }
		(x[1], analyze(x[2]));
    	} 
	else if (x[0] === 'lambda') 
	{     
                return analyze_lambda(x);
    	} 
	else if (x[0] === 'begin') 
	{      
                x.shift();
                return analyze_sequence(x);
    	} 
	else 
	{                            
                var aprocs = x.map(analyze);
                var fproc = aprocs.shift();     
                return function (e) 
		{
                        var opprocs = aprocs.map(function (aproc) {return aproc(e);});
                        return fproc(e).apply(e, opprocs);
                }
    	}
}

var analyze_lambda = function (x) 
{
        var vars = x[1];
        var bproc = analyze_sequence([x[2]]);
        return function (e) 
	{
        	return function () 
		{
                	return bproc(env({params: vars, args: arguments, outer: e }));
        	}              
        }
}

var analyze_sequence = function (x) 
{
        var procs = x.map(analyze);
        return function (e) 
	{
                var result;
                var i;
                for (i = 0; i < procs.length; i += 1) 
		{
                        result = procs[i](e);
                }
                return result;
        }
}

var atom = function (token) 
{
	if (isNaN(token)) 
	{
                return token;
    	} 
	else 
	{
                return +token; 
    	}
}

var tokenize = function (s) 
{
	return s.replace(/\(/g, ' ( ').replace(/\)/g, ' ) ').pysplit();
}

String.prototype.trim = function () 
{
	return this.replace(/^\s+|\s+$/g, '');
}

String.prototype.pysplit = function () 
{
	return this.replace(/\s+/g, ' ').trim().split(' ');
}

var read_from = function (tokens) 
{
	if (0 === tokens.length) 
	{
                throw {
                        name: 'SyntaxError',
                        message: 'unexpected EOF while reading'
                      }
        }
    	var token = tokens.shift();
    	if ('(' === token) 
	{
                var L = [];
        	while (')' !== tokens[0]) 
		{
            		L.push(read_from(tokens));
        	}
        	tokens.shift(); 
        	return L;
    	} 
	else 
	{
                if (')' === token) 
		{
                        throw {
                                name: 'SyntaxError',
                                message: 'unexpected )'
                              }
                } 
		else 
		{
                        return atom(token);
                }
    }
}

var read = function (s) 
{
	return read_from(tokenize(s));
}

var parse = read;

function repl()
{
        process.stdin.resume();
        process.stdout.write('Lisp> ');
        process.stdin.on('data',function(input)
        {
                input = input.toString();
                var val = eval(parse(input))
                if (val != undefined)
                {
                        process.stdout.write('Result:'+val);
                }
                else
                {
                        process.stdout.write('Lisp> ');
                }
        }
  )
}

repl();

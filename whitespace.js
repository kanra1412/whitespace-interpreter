'use strict'

var fs = require('fs');

var f_path = 'test/http _compsoc.dur.ac.uk_whitespace_count.ws',
	f_path2 = 'test/helloworld.ws',
	f_path3 = 'test/count.ws';

fs.readFile(f_path, (err, data) => {
	if(err) {
		throw new Error(err);
	}
	console.log(data.toString().length);
	let str = convers(data);
	console.log('[ source ]:', str,'\n[ length ]:',str.length);

	get_op(str);
	console.log('--------------------------------------------');
	console.log('stack:',stack, '\nheap:', heap, '\nop_list:', op_list, '\nlabel_list:', label_list);
	console.log('--------------------------------------------');

	let i = 0;
	exec_op(i, x => x < op_list.length);

	console.log('[ output ]: ', output);
});

// global var
var stack = [], heap = {}, op_list = [], label_list = [], sub_list = [], output = '';

function get_op(str) {
	if (str === '') {
		return ;
	}
	let i = 0;
	while(str[i] !== undefined) {
		let op = map[str[i]];
		i++;
		while(op !== undefined && typeof op[0] !== 'string') {
			op = op[str[i]];
			if (op === undefined) {
				err('syntax err');
			}
			i++;
		}
		// has parameter
		if (op !== undefined && op[1] === 1) {
			let para = '';
			while(str[i] !== 'n') {
				para += str[i];
				i++;
			}
			// parameter need label
			if (label_func.indexOf(op[0]) === -1) {
				para = get_label(para);
			}
			// number
			else {
				para = get_num(para);
			}
			i++;

			op_list.push([op[0], para]);
			if (op[0] === 'def') {
				func_map[op[0]](para);
			}
		}
		// no parameter
		else {
			op_list.push(op[0]);
		}
		// console.log(i);
	}
}

function get_num(str) {
	var num = parseInt(str.slice(1).replace(/t/g, '1').replace(/s/g, '0'), 2);
	return str[0] === 't'? (0-num): num;
}

function get_label(str) {
	return parseInt(str.replace(/t/g, '1').replace(/s/g, '0'), 2);
}

function convers(data) {
	return data.toString().replace(/[^\n\t ]/g, '').replace(/\t/g, 't').replace(/\n/g, 'n').replace(/\r/g, '').replace(/ /g, 's');
}

function exec_op(i, flag) {
	if (typeof flag === 'function') {
		while(flag(i)) {
			if (typeof op_list[i] !== 'object') {
				if (op_list[i] === 'output_num' || op_list[i] === 'output_char') {
					output += func_map[op_list[i]]();
				}
				else {
					func_map[op_list[i]]();
				}
			}
			else {
				if (op_list[i][0] !== 'def') {
					func_map[op_list[i][0]](op_list[i][1]);
				}
			}
			i++;
		}
	}
	else {
		err('argument err');
	}
}

function is_stack_empty() {
	if (stack.length < 1) {
		err('stack empty');
	}
}

function err(msg) {
	throw new Error(msg);
}

var func_map = {
	// I/O
	output_char: () => {
		is_stack_empty();
		return String.fromCharCode(stack.pop());
	},
	output_num: () => {
		is_stack_empty();
		let num = stack.pop();
		return isNaN(num)? 0: num;
	},
	input_char: (x) => {
		is_stack_empty();
		heap[stack[stack.length-1]] = x;
	},
	input_num: (x) => {
		is_stack_empty();
		heap[stack[stack.length-1]] = x;
	},

	// stack
	push: (x) => {
		if (!isNaN(x)) {
			stack.push(x);
		}
		else {
			stack.push(0);
		}
	},
	copy: (x) => {
		if (x < 0) {
			err('index out range');
		}
		if (stack.length > x) {
			stack.push(stack[stack.length - 1 - x]);
		}
		else {
			err('stack empty');
		}
	},
	remove: (x) => {
		if (x < 0 || x > stack.length - 1) {
			stack = [stack.pop()];
		}
		else {
			stack.splice(stack.length -1 - x, x);
		}
	},
	copy_top: () => {
		is_stack_empty();
		stack.push(stack[stack.length-1]);
	},
	change: () => {
		is_stack_empty();
		let t = stack[stack.length-2];
		stack[stack.length-2] = stack.pop();
		stack.push(t);
	},
	rm_top: () => {
		is_stack_empty();
		stack.pop();
	},

	// ctrl
	end: () => {
		// console.log('stack:',stack, '\nheap:', heap, '\nop_list:', op_list, '\nlabel_list:', label_list);
		stack = [];
		heap = {};
		op_list = [];
		label_list = [];
	},
	def: (x) => {
		if (label_list.filter(i => isNaN(x)?isNaN(i[0]): i[0] === x).length !== 0) {
			err('label already def');
		}
		label_list.push([x, op_list.length-1]);
	},
	call: (x) => {
		let target = label_list.filter(i => isNaN(x)?isNaN(i[0]): i[0] === x);
		if (target.length !== 0) {
			let context = op_list.filter(i => i==='object' && i[0]==='call');
			sub_list.push([x, op_list.indexOf(context)]);

			let index = target[0][1]+1;
			exec_op(index, (x) => {
				if (x === op_list.length - 1 && op_list[x] !== 'end') {
					err('return not exists');
				}
				return op_list[x] !== 'ret' && x < op_list.length;
			});
		}
		else {
			err('unknown sub');
		}
	},
	jump: (x) => {
		let target = label_list.filter(i => isNaN(x)?isNaN(i[0]): i[0] === x);
		if (target.length !== 0) {
			let index = target[0][1]+1;
			exec_op(index, x => x < op_list.length);
		}
		else {
			err('label not def');
		}
	},
	jump_zero: (x) => {
		is_stack_empty();
		if (stack.pop() === 0) {
			func_map['jump'](x);
		}
	},
	jump_nagative: (x) => {
		is_stack_empty();
		if (stack.pop() < 0) {
			func_map['jump'](x);
		}
	},
	ret: () => {
		if (sub_list.length > 0) {
			func_map[sub_list.pop()];
		}
		else {
			err('sub return err');
		}
	},

	// heap
	save: () => {
		is_stack_empty();
		heap[stack[stack.length-2]] = stack.pop();
		stack.pop();
	},
	load: () => {
		is_stack_empty();
		if (heap[stack[stack.length-1]] !== undefined) {
			stack.push(heap[stack.pop()]);
		}
		else {
			err('addr error');
		}
	},

	// math
	add: () => {
		if (stack.length < 2) {
			err('stack val err');
		}
		else {
			stack.push(stack.pop() + stack.pop());
		}
	},
	multi: () => {
		if (stack.length < 2) {
			err('stack val err');
		}
		else {
			stack.push(stack.pop() * stack.pop());
		}
	},
	minus: () => {
		if (stack.length < 2) {
			err('stack val err');
		}
		else {
			stack.push(0 - stack.pop() + stack.pop());
		}
	},
	divide: () => {
		if (stack.length < 2) {
			err('stack val err');
		}
		else {
			let argu1 = stack.pop(), argu2 = stack.pop();
			if (argu1 === 0) {
				err('divisor err');
			}
			stack.push(Math.floor(argu2 / argu1));
		}
	},
	mod: () => {
		if (stack.length < 2) {
			err('stack val err');
		}
		else {
			let argu1 = stack.pop(), argu2 = stack.pop();
			if (argu1 === 0) {
				err('modulo by zero');
			}
			else {
				if (argu1 * argu2 < 0) {
					let re = (argu2 % argu1) === 0? 0: (Math.abs(argu1) * (~~(Math.abs(argu2 / argu1)) + 1) - Math.abs(argu2));
					if (argu1 < 0) {
						stack.push(0-re);
					}
					else {
						stack.push(re);
					}
				}
				else {
					stack.push(argu2 % argu1);
				}
			}
		}
	}
};

var map = {
	'n': {
		's': {
			's': ['def', 1],
			't': ['call', 1],
			'n': ['jump', 1]
		},
		't': {
			's': ['jump_zero', 1],
			't': ['jump_nagative', 1],
			'n': ['ret', 0]
		},
		'n': {
			'n': ['end', 0]
		}
	},
	't': {
		'n': {
			's': {
				's': ['output_char', 0],
				't': ['output_num', 0]
			},
			't': {
				's': ['input_char', 1],
				't': ['input_num', 1]
			}
		},
		't': {
			's': ['save', 0],
			't': ['load', 0]
		},
		's': {
			's': {
				's': ['add', 0],
				'n': ['multi', 0],
				't': ['minus', 0]
			},
			't': {
				's': ['divide', 0],
				't': ['mod', 0]
			}
		}
	},
	's': {
		's': ['push', 1],
		't': {
			's': ['copy', 1],
			'n': ['remove', 1]
		},
		'n': {
			's': ['copy_top', 0],
			't': ['change', 0],
			'n': ['rm_top', 0]
		}
	}
};

var label_func = ['push', 'remove', 'copy', 'input_num'];

// var map = {
// 	'\n': {
// 		' ': {
// 			' ': ['def', 1],
// 			'\t': ['call', 1],
// 			'\n': ['jump', 1]
// 		},
// 		'\t': {
// 			' ': ['jump_zero', 1],
// 			'\t': ['jump_nagative', 1],
// 			'\n': ['ret', 0]
// 		},
// 		'\n': {
// 			'\n': ['end', 0]
// 		}
// 	},
// 	'\t': {
// 		'\n': {
// 			' ': {
// 				' ': ['output_char', 0],
// 				'\t': ['output_num', 0]
// 			},
// 			'\t': {
// 				' ': ['input_char', 1],
// 				'\t': ['input_num', 1]
// 			}
// 		},
// 		'\t': {
// 			' ': ['save', 1],
// 			'\t': ['load', 0]
// 		},
// 		' ': {
// 			' ': {
// 				' ': ['add', 0],
// 				'\n': ['multi', 0],
// 				'\t': ['minus', 0]
// 			},
// 			'\t': {
// 				' ': ['divide', 0],
// 				'\t': ['mod', 0]
// 			}
// 		}
// 	},
// 	' ': {
// 		' ': ['push', 1],
// 		'\t': {
// 			' ': ['copy', 1],
// 			'\n': ['remove', 1]
// 		},
// 		'\n': {
// 			' ': ['copy_top', 0],
// 			'\t': ['change', 0],
// 			'\n': ['rm_top', 0]
// 		}
// 	}
// };
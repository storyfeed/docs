<?php
// Tokenize source only: never require core, boot Laravel, or evaluate its config.
function significant(string $source): array {
    return array_values(array_filter(token_get_all($source), fn($t) => !is_array($t) || !in_array($t[0], [T_WHITESPACE, T_COMMENT, T_DOC_COMMENT, T_OPEN_TAG])));
}
function value($t): string { return is_array($t) ? $t[1] : $t; }
$result = ['classes' => [], 'config' => []];
foreach (json_decode(stream_get_contents(STDIN), true, flags: JSON_THROW_ON_ERROR) as $file => $source) {
    $ts = significant($source);
    if ($file === 'config/storyfeed.php') {
        // Literal array keys, tracking every bracket (including non-array expressions).
        $stack = []; $pending = null;
        for ($i = 0; $i < count($ts); $i++) {
            $v = value($ts[$i]);
            if (is_array($ts[$i]) && $ts[$i][0] === T_CONSTANT_ENCAPSED_STRING && value($ts[$i+1] ?? '') === '=>') {
                $pending = substr($v, 1, -1);
                $path = array_values(array_filter($stack, fn($x) => $x !== null));
                $result['config'][] = implode('.', [...$path, $pending]);
            } elseif ($v === '[') { $stack[] = $pending; $pending = null; }
            elseif ($v === ']') { array_pop($stack); $pending = null; }
            elseif ($v === ',') { $pending = null; }
        }
        continue;
    }
    $namespace = ''; $depth = 0; $class = null; $bodyDepth = null; $visibility = null;
    for ($i = 0; $i < count($ts); $i++) {
        $t = $ts[$i]; $v = value($t); $id = is_array($t) ? $t[0] : null;
        if ($id === T_NAMESPACE) { $namespace = value($ts[++$i]); }
        if (in_array($id, [T_CLASS, T_INTERFACE, T_TRAIT, T_ENUM], true) && is_array($ts[$i+1] ?? null) && $ts[$i+1][0] === T_STRING && value($ts[$i-1] ?? '') !== '::') {
            $class = $namespace.'\\'.value($ts[++$i]);
            $result['classes'][$class] = ['methods' => [], 'properties' => [], 'open' => false];
            if ($id === T_ENUM) {
                $result['classes'][$class]['methods'] = ['cases'];
                $result['classes'][$class]['properties'] = ['name'];
                if (value($ts[$i+1] ?? '') === ':') {
                    $result['classes'][$class]['methods'] = ['cases', 'from', 'tryFrom'];
                    $result['classes'][$class]['properties'][] = 'value';
                }
            }
            $bodyDepth = $depth + 1;
            for ($j = $i+1; isset($ts[$j]) && value($ts[$j]) !== '{'; $j++) {
                if (is_array($ts[$j]) && $ts[$j][0] === T_EXTENDS) $result['classes'][$class]['open'] = true;
            }
        }
        if ($v === '{') $depth++;
        if ($class && $depth === $bodyDepth) {
            if (in_array($id, [T_PUBLIC, T_PROTECTED, T_PRIVATE], true)) $visibility = $id;
            if ($id === T_USE) $result['classes'][$class]['open'] = true;
            if ($id === T_FUNCTION) {
                $j = $i+1; if (value($ts[$j] ?? '') === '&') $j++;
                $name = value($ts[$j] ?? '');
                if (is_array($ts[$j] ?? null) && $ts[$j][0] === T_STRING) {
                    if ($visibility === null || $visibility === T_PUBLIC) $result['classes'][$class]['methods'][] = $name;
                    if (in_array($name, ['__call', '__callStatic'])) $result['classes'][$class]['open'] = true;
                }
                $visibility = null;
            }
            if ($id === T_VARIABLE && $visibility === T_PUBLIC) $result['classes'][$class]['properties'][] = substr($v, 1);
            if ($v === ';') $visibility = null;
        }
        if ($v === '}') {
            if ($class && $depth === $bodyDepth) { $class = null; $bodyDepth = null; }
            $depth--; $visibility = null;
        }
    }
}
echo json_encode($result, JSON_THROW_ON_ERROR);

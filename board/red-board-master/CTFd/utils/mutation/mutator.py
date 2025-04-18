from re import findall

substitutionDict = {"a": "aA4", "b": "bB", "c": "cC", "d": "dD", "e": "eE3", "f":"fF", "g": "gG6", "h": "hH", "i": "iI1", "j": "jJ", "k": "kK", "l":"lL", "m": "mM", "n": "nN", "o": "oO0", "p": "pP", "q": "qQ", "r": "rR", "s":"sS5", "t": "tT7", "u": "uU", "v": "vV", "w":"wW", "x": "xX", "y": "yY", "z": "zZ"}

leetEncodedSymbols = "4361057"
leetSymbols = "aegiost"
ordinarySymbols = "bcdfhjklmnpqruvwxyz"

def preCalculate(s):
    devidorsSequence = []
    module = 1
    for i in s:
        if i in leetSymbols:
            module *= 3
            devidorsSequence.append(3)
        elif i in ordinarySymbols:
            module *= 2
            devidorsSequence.append(2)
        else:
            devidorsSequence.append(1)
    module -= 1
    return module, devidorsSequence

def mutate(fl, secret):
    payload = findall(r"{(.+)}", fl)
    if len(payload) == 0:
        s = fl
    else:
        s = payload[0]
    enc = ""
    value = 1
    module, devidorsSequence = preCalculate(s)

    for counter, i in enumerate(devidorsSequence):
        if value >= module:
            if i ==  1:
                return fl.replace(s, enc + s[counter:])
            return fl.replace(s, enc + s[counter + 1:])
        if i == 1:
            enc += s[counter]
            continue
        el = secret % i
        value *= i
        enc += substitutionDict[s[counter]][el]
        secret = secret // i
        
    return fl.replace(s, enc + s[counter + 1:])

def normalize(s):
    s = s.lower()
    for a, b in zip(leetEncodedSymbols, leetSymbols):
        s = s.replace(a, b)
    return s

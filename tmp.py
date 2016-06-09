import itertools


def answer(x):
    import collections
    import math
    if x == 0:
        return []

    indexes = set()

    def probe(remaining, solved):
        if remaining == 0:
            solved['val'] = True
            return

        lg = math.log(x, 3)

        # iterate in reverse order
        for val in xrange(int(math.ceil(lg)), -1, -1):
            # bound if all the remaining numbers combined
            # can't fill the remainder
            if (1 - 3 ** (val + 1)) / (1 - 3) < abs(remaining):
                break

            if (val, 1) not in indexes and (val, -1) not in indexes:
                indexes.add((val, 1))
                probe(remaining + 3 ** val, solved)
                if solved['val']:
                    return
                indexes.remove((val, 1))

                indexes.add((val, -1))
                probe(remaining - 3 ** val, solved)
                if solved['val']:
                    return
                indexes.remove((val, -1))

    probe(x, {'val': False})

    fmt_dict = {
        1: 'L',
        0: '-',
        -1: 'R',
    }
    highest_exponent = max(list(indexes), key=lambda x: x[0])[0]
    index_dict = collections.defaultdict(lambda: 0)
    index_dict.update({v[0]: v[1] for v in indexes})
    return [fmt_dict[index_dict[i]] for i in xrange(highest_exponent + 1)]



print answer(100000000)
print answer(8)


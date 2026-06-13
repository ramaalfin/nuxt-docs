type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

type Join<K extends string | number, P extends string | number> = 
    P extends "" ? `${K}` : `${K}.${P}`;

/**
 * Extracts all valid dot-notation paths from an object/array recursively.
 * e.g., 'address.street', 'tags.0', 'tags.0.id'
 */
export type Paths<T, D extends number = 10> = [D] extends [never] ? "" : 
    T extends Date ? "" : 
    T extends Function ? "" :
    T extends Array<infer U> ?
        `${number}` | Join<`${number}`, Paths<U, Prev[D]>>
    : T extends object ?
        {
            [K in Extract<keyof T, string>]: `${K}` | Join<K, Paths<T[K], Prev[D]>>
        }[Extract<keyof T, string>]
    : "";

/**
 * Maps all extracted paths to a string error message.
 */
export type FormErrors<T> = Partial<Record<Paths<T>, string>>;

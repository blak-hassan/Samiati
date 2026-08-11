export type LooseDoc = Record<string, any> & {
    _id: string;
    _creationTime?: number;
};

type LooseQuery = {
    collect: () => Promise<LooseDoc[]>;
    first: () => Promise<LooseDoc | null>;
    withIndex: (indexName: string, queryFn: (q: any) => any) => LooseQuery;
    filter: (queryFn: (q: any) => any) => LooseQuery;
    order: (direction: "asc" | "desc") => LooseQuery;
    take: (limit: number) => Promise<LooseDoc[]>;
};

export type LooseDb = {
    query: (table: string) => LooseQuery;
    insert: (table: string, value: Record<string, unknown>) => Promise<string>;
    get: (id: string) => Promise<LooseDoc | null>;
    patch: (id: string, value: Record<string, unknown>) => Promise<void>;
};

export function getLooseDb(ctx: { db: unknown }) {
    return ctx.db as LooseDb;
}

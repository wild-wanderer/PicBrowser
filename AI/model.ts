
export interface Tagish {
    type: string;
}

export interface Tag extends Tagish {
    value: string;
    id: string;

    checked?: boolean;
    important?: boolean;
    disabled?: boolean;
}

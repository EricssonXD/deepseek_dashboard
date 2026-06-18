import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export type WithElementRef<T> = T & {
	ref?: T extends { ref?: infer R } ? R : never;
};

export type WithoutChildren<T> = Omit<T, 'children'>;
export type WithoutChild<T> = WithoutChildren<T>;
export type WithoutChildrenOrChild<T> = WithoutChildren<T>;

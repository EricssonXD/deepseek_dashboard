export interface DashboardRow {
	zipName: string;
	csvName: string;
	userId: string;
	utcDate: string;
	model: string;
	walletType: string;
	cost: number;
	currency: string;
	apiKeyMasked: string;
	apiKeyName: string;
	type: string;
	price: number;
	amount: number;
	rowType: 'cost' | 'amount';
}

export interface KeySummary {
	apiKeyMasked: string;
	apiKeyName: string;
	cost: number;
	models: string[];
}

export interface KeyDetail {
	apiKeyName: string;
	apiKeyMasked: string;
	models: string;
	cost: number;
	costPct: string;
	outputTokens: number;
	inputCacheHit: number;
	inputCacheMiss: number;
	cacheHitRate: string;
	requestCount: number;
}

export interface DailyKeyUsage {
	date: Date;
	[key: string]: Date | number;
}

export interface FetchStatus {
	message: string;
	type: '' | 'success' | 'error' | 'loading';
}

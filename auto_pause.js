/**
 * Campaign Auto-pause
 *
 * This script will pause all campaigns if their total accumulated spend
 * for the current month.
 *
 * Copyright (c) 2014. by Way2CU, http://way2cu.com
 * Authors: Mladen Mijatov
 */

var LIMIT = 1950;

function main() {
	var total_spend = 0;
	var campaigns = AdWordsApp.campaigns.get();

	// find total amount of money spent for current month
	while (campaigns.hasNext()) {
		var campaign = campaigns.next();
		var stats = campaign.getStatsFor('THIS_MONTH');

		// accumulate total amount spent
		total_spend += stats.getCost();
	}

	// total spending is within limits
	if (total_spend < LIMIT)
		return;

	// pause all the campaigns
	var campaigns = AdWordsApp.campaigns.get();
	while (campaigns.hasNext()) {
		var campaign = campaigns.next();
		campaign.pause();
	}
}

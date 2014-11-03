/**
 * AdWords Daily Report
 *
 * This script accumulates data accross specified campaigns
 * and adds row to the specified Google Spreadsheet document.
 *
 * Copyright (c) 2014. by Way2CU, http://way2cu.com
 * Authors: Mladen Mijatov
 */

var DOCUMENT_URL = '';
var DATE_COLUMN = 1;
var CAMPAIGN_COLUMN = {
};

function main() {
	var data = {};
	var campaigns = AdWordsApp.campaigns().get();
	var spreadsheet = new Document(DOCUMENT_URL);
	var sheet = spreadsheet.get_active_sheet();
	var row_number = spreadsheet.get_empty_row(sheet, 2);  // start from second row, first one is always empty

	// collect data from campaigns
	while (campaigns.hasNext()) {
		var campaign = campaigns.next();

		// make sure campaign is defined in columns list
		if (!(campaign.getName() in CAMPAIGN_COLUMN))
			continue;

		// get data to work with
		var stats = campaign.getStatsFor('YESTERDAY');
		var clicks_column = CAMPAIGN_COLUMN[campaign.getName()];
		var cost_column = clicks_column + 2;

		// set data
		if (clicks_column in data) {
			// data already exist, add
			data[clicks_column].clicks += stats.getClicks();
			data[clicks_column].cost += stats.getCost();

		} else {
			// no data present, create new container object
			data[clicks_column] = {
				'cost_column': clicks_column + 2,
				'clicks': stats.getClicks(),
				'cost': stats.getCost()
			};
		}
	}

	// make sure we have enough rows
	if (row_number < 0) {
		sheet.insertRowsAfter(sheet.getMaxRows(), 2);
		row_number = spreadsheet.get_empty_row(sheet, 2);
	}

	// format timestamp
	var now = new Date(Utilities.formatDate(new Date(), AdWordsApp.currentAccount().getTimeZone(), "MMM dd,yyyy HH:mm:ss"));
	var yesterday = new Date(now.getTime() - 24 * 3600 * 1000);
	var timestamp = Utilities.formatDate(yesterday, "PST", "yyyy-MM-dd");
	var days_in_month = new Date(yesterday.getYear(), yesterday.getMonth(), 0).getDate();

	// set timestamp in document
	sheet.getRange(row_number, DATE_COLUMN).setValue(timestamp);

	// store data
	for (var clicks_column in data) {
		var campaign_data = data[clicks_column];
		sheet.getRange(row_number, clicks_column).setValue(campaign_data.clicks);
		sheet.getRange(row_number, campaign_data.cost_column).setValue(campaign_data.cost);
	}

	// create summary if needed
	if (yesterday.getDate() == days_in_month) {
		var row_totals = row_number + 1;
		var start_row = row_number - days_in_month;
		var row_height = sheet.getRowHeight(row_totals) * 2;

		sheet.setRowHeight(row_totals, row_height);
		sheet.getRange(row_totals, DATE_COLUMN).setValue(timestamp);

		// initial range
		var range = sheet.getRange(row_totals, clicks_column);

		// apply for all 5 columns
		for (var i=0; i<5; i++) {
			var column = getColumn(clicks_column, i);

			with (range) {
				setFontStyle('bold')
				setVerticalAlignment('top')
				setBorder(true, false, false, false, false, false)
				setFormula('=SUM()');
			}

			range = range.offset(0, 1);
		}
	}

	// show notification toast
	spreadsheet.toast('Report has been updated!');
}

/**
 * Constructor function for spreadsheet object.
 *
 * @param string url
 */
function Document(url) {
	var self = this;

	self.spreadsheet = null;

	/**
	 * Complete object intialization.
	 */
	self.__init = function() {
		self.spreadsheet = SpreadsheetApp.openByUrl(url);
	};

	/**
	 * Get sheet from opened spreadsheet.
	 *
	 * @param string sheet
	 * @return Spreadsheet.Sheet
	 */
	self.get_sheet = function(sheet) {
		return self.spreadsheet.getSheetByName(sheet);
	};

	/**
	 * Return active sheet.
	 *
	 * @return Spreadsheet.Sheet
	 */
	self.get_active_sheet = function() {
		return self.spreadsheet.getActiveSheet();
	};

	/**
	 * Show message inside of document.
	 *
	 * @param string message
	 */
	self.toast = function(message) {
		self.spreadsheet.toast(message, 'Callbox.co.il', 5000);
	};

	/**
	 * Get index of first empty row.
	 *
	 * @param Spreadsheet.Sheet sheet
	 * @param integer start
	 * @return integer
	 */
	self.get_empty_row = function(sheet, start) {
		var values = sheet.getRange(start, 1, sheet.getMaxRows(), 1).getValues();
		var result = -1;

		for (var i=0, count=values.length; i<count; i++)
			if (!values[i][0]) {
				result = i + start;
				break;
			}

		return result;
	};

	// finalize object
	self.__init();
}

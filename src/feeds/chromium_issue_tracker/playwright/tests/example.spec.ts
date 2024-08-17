import { test, expect } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { CITResult } from '../../../modules/cit-types';

const TIME_TO_WAIT = 0.5 * 1000;

const COLUMN_TITLES = ["ID", "TITLE", "COMPONENT", "CREATED"];

const CHROMIUM_ISSUE_TRACKER_URL_BASE = "https://issues.chromium.org"

test('Visit Chromium issue tracker and get the information', async ({ page }) => {
    await page.goto('https://issues.chromium.org/issues?q=status:open');

    await page.waitForSelector('table');

    /**
     * Show Created and Component
     **/
    await page.locator('div[aria-label="Last modified column configuration"]').click();
    await page.waitForTimeout(TIME_TO_WAIT);
    await page.getByText('Add column right').click();
    await page.waitForTimeout(TIME_TO_WAIT);
    await page.getByRole('menuitem', { name: 'Created' }).click();
    await page.waitForTimeout(TIME_TO_WAIT);

    await page.locator('div[aria-label="Last modified column configuration"]').click();
    await page.waitForTimeout(TIME_TO_WAIT);
    await page.getByText('Add column right').click();
    await page.waitForTimeout(TIME_TO_WAIT);
    await page.locator('button.mat-mdc-menu-item').getByText('Component').click();

    await page.waitForTimeout(TIME_TO_WAIT);
    await page.waitForTimeout(TIME_TO_WAIT);
    await page.waitForTimeout(TIME_TO_WAIT);

    /**
     * Get indices of TITLE, COMPONENT, and CREATED
     **/
    const tableLocator = page.locator('table');
    const theadLocator = tableLocator.locator('thead');

    let i = 0;
    const columnIndexMap: Record<string, number> = {};
    for (const th of await theadLocator.locator('th').all()) {
        const label = await th.innerText()
        if (COLUMN_TITLES.includes(label)) {
            columnIndexMap[label] = i;
        }
        i += 1;
    }

    /**
     * This part is a workaround. In the Chromium issue tracker, the newly
     * added column's values are inserted as a number firstly. And after that,
     * the number is replaced with the true value.
     **/
    const watchDog = page.waitForFunction(() => {
        const cellText = Number(document.querySelectorAll("tbody tr .componentPath-cell")[0]?.innerText);
        return Number.isNaN(Number(cellText));
    });

    await watchDog;


    const rowsLocator = tableLocator.locator('tbody tr');
    const rowCount = await rowsLocator.count();

    const results = []

    for (let i = 0; i < rowCount; i++) {
        const rowLocator = rowsLocator.nth(i); // i番目の行を取得
        const cellsLocator = rowLocator.locator('td'); // セルとヘッダーのlocator

        const res: Record<string, any> = {};
        for (const key of Object.keys(columnIndexMap)) {
            const idx = columnIndexMap[key];
            const cellLocator = cellsLocator.nth(idx);
            const cellText = await cellLocator.innerText();
            res[key.toLowerCase()] = cellText;
        }
        res["link"] = `${CHROMIUM_ISSUE_TRACKER_URL_BASE}/issues/${res["id"]}`
        results.push(res);
    }

    // TODO: validate that results is CITResult[].


    writeFileSync("result.json", JSON.stringify(results));

});

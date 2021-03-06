describe('MainLayout.vue', () => {
  it('Has a title that changes according to language', () => {
    browser.url(`/en/login`)
    const title = browser.getTitle()
    expect(title).toBe('Utopian Authentication')
  })
  it('Has a title that changes according to language', () => {
    browser.url(`/de/login`)
    const title = browser.getTitle()
    expect(title).toBe('Utopian Authentifizierung')
  })
})

/*

    browser.element('body > #q-app > div > div.col-md-4.col-sm-12.col-xs-12.row.login-pane > div:nth-child(1) > div > button').click()
    browser.waitForVisible('body > div.q-popover.scroll.animate-popup-down > div > div')
    const langs = $$('body > div.q-popover.scroll.animate-popup-down > div > div')
    expect(langs.length).toBe(2)
    langs[1].click()
    const lang = browser.element('#q-app > div > header > div > button > div.q-btn-inner.row.col.items-center.justify-center > div').getText()
    expect(lang).toBe('FR')

 */

page-my-top
    title マイページ - Quesdon
    loading(if="{!loaded}")
    virtual(if="{loaded}")
        h1 マイページ
        p こんにちは、{user.name}さん!
        ul
            li: a(href="/@{user.acct}") あなたのプロフィール
            li: a(href="/my/questions") あなた宛ての質問
            li: a(href="/my/followers") フォロワーのQuesdon利用者
            li: a(href="/my/settings") 設定
            li: a(href="#",onclick="{logout}") ログアウト
    script.
        import "../loading.tag"
        apiFetch("/api/web/accounts/verify_credentials").then(r => r.json()).then(r => {
            this.user = r
            this.loaded = true
            this.update()
        })
        this.logout = e => {
            e.preventDefault()
            if(!confirm("ログアウトしていい?")) return
            apiFetch("/api/web/logout").then(r => r.json()).then(r => {
                location.pathname = "/"
            })
        }
/**
 * Bundled public-domain starter songs, seeded into a new user's library on
 * first launch (see seedDemoSongs.ts). Embedded as plain string constants
 * rather than loaded as Metro assets — simpler and more reliable than
 * configuring a custom asset extension for a handful of small text files.
 * Source text lives in assets/demo-songs/*.cho for reference; keep both in
 * sync if either changes.
 */

const AMAZING_GRACE = `{title: Amazing Grace}
{artist: John Newton}
{key: G}

{start_of_verse}
[G]Amazing grace, how [G7]sweet the [C]sound
That [G]saved a wretch like [D]me
I [G]once was lost, but [G7]now am [C]found
Was [G]blind, but [D]now I [G]see
{end_of_verse}

{start_of_verse}
'Twas [G]grace that taught my [G7]heart to [C]fear
And [G]grace my fears re[D]lieved
How [G]precious did that [G7]grace ap[C]pear
The [G]hour I [D]first be[G]lieved
{end_of_verse}

{start_of_verse}
Through [G]many dangers, [G7]toils and [C]snares
I [G]have already [D]come
'Tis [G]grace hath brought me [G7]safe thus [C]far
And [G]grace will [D]lead me [G]home
{end_of_verse}

{start_of_verse}
When [G]we've been there ten [G7]thousand [C]years
Bright [G]shining as the [D]sun
We've [G]no less days to [G7]sing God's [C]praise
Than [G]when we've [D]first be[G]gun
{end_of_verse}
`;

const OH_SUSANNA = `{title: Oh! Susanna}
{artist: Stephen Foster}
{key: D}

{start_of_verse}
I [D]come from Alabama with my [G]banjo on my [D]knee
I'm [D]going to Louisiana, my [A7]true love for to [D]see
It [D]rained all night the day I left, the [G]weather it was [D]dry
The [D]sun so hot I froze to death, Su[A7]sanna, don't you [D]cry
{end_of_verse}

{start_of_chorus}
Oh! [D]Susanna, oh [G]don't you [D]cry for me
For I [D]come from Ala[A7]bama with my [D]banjo on my knee
{end_of_chorus}

{start_of_verse}
I had a dream the [G]other night when [D]everything was still
I [D]thought I saw Susanna dear, a[A7]coming down the [D]hill
The [D]buckwheat cake was in her mouth, the [G]tear was in her [D]eye
Says [D]I, I'm coming from the south, Su[A7]sanna, don't you [D]cry
{end_of_verse}

{start_of_chorus}
Oh! [D]Susanna, oh [G]don't you [D]cry for me
For I [D]come from Ala[A7]bama with my [D]banjo on my knee
{end_of_chorus}
`;

const WAYFARING_STRANGER = `{title: Wayfaring Stranger}
{artist: Traditional}
{key: Am}

{start_of_verse}
I am a [Am]poor wayfaring [C]stranger
While [Am]traveling through this [Em]world of [Am]woe
Yet [Am]there's no sickness, [C]toil, nor danger
In [Am]that bright land to [Em]which I [Am]go
{end_of_verse}

{start_of_verse}
I'm [Am]going there to [C]see my father
I'm [Am]going there no [Em]more to [Am]roam
I'm [Am]only going [C]over Jordan
I'm [Am]only going [Em]over [Am]home
{end_of_verse}

{start_of_verse}
I [Am]know dark clouds will [C]gather round me
I [Am]know my way is [Em]rough and [Am]steep
Yet [Am]beauteous fields lie [C]just before me
Where [Am]God's redeemed their [Em]vigils [Am]keep
{end_of_verse}

{start_of_verse}
I'm [Am]going there to [C]see my mother
She [Am]said she'd meet me [Em]when I [Am]come
I'm [Am]only going [C]over Jordan
I'm [Am]only going [Em]over [Am]home
{end_of_verse}
`;

const SCARBOROUGH_FAIR = `{title: Scarborough Fair}
{artist: Traditional}
{key: Dm}

{start_of_verse}
Are you [Dm]going to Scarborough [C]Fair?
[Dm]Parsley, [C]sage, rose[Dm]mary and [C]thyme
[Dm]Remember me to [C]one who lives [Dm]there
For [C]once she was a [Dm]true love of mine
{end_of_verse}

{start_of_verse}
Tell her to [Dm]make me a cam[C]bric shirt
[Dm]Parsley, [C]sage, rose[Dm]mary and [C]thyme
With[Dm]out no seam nor [C]needlework
And [C]then she'll be a [Dm]true love of mine
{end_of_verse}

{start_of_verse}
Tell her to [Dm]find me an [C]acre of land
[Dm]Parsley, [C]sage, rose[Dm]mary and [C]thyme
Be[Dm]tween the salt water and [C]the sea strand
And [C]then she'll be a [Dm]true love of mine
{end_of_verse}

{start_of_verse}
Tell her to [Dm]reap it with a [C]sickle of leather
[Dm]Parsley, [C]sage, rose[Dm]mary and [C]thyme
And [Dm]gather it all in a [C]bunch of heather
And [C]then she'll be a [Dm]true love of mine
{end_of_verse}
`;

const DANNY_BOY = `{title: Danny Boy}
{artist: Frederic Weatherly}
{key: D}

{start_of_verse}
Oh [D]Danny boy, the [G]pipes, the [D]pipes are calling
From [G]glen to [D]glen, and [A7]down the mountain[D]side
The [D]summer's gone, and [G]all the [D]roses falling
It's [Bm]you, it's [Em]you must [A7]go and I must [D]bide
{end_of_verse}

{start_of_verse}
But [D]come ye back when [G]summer's [D]in the meadow
Or [G]when the [D]valley's [A7]hushed and white with [D]snow
It's [D]I'll be here in [G]sunshine [D]or in shadow
Oh [Bm]Danny [Em]boy, oh [A7]Danny boy, I [D]love you so
{end_of_verse}

{start_of_verse}
And [D]if you come, when [G]all the [D]flowers are dying
And [G]I am [D]dead, as [A7]dead I well may [D]be
You'll [D]come and find the [G]place where [D]I am lying
And [Bm]kneel and [Em]say an [A7]Ave there for [D]me
{end_of_verse}

{start_of_verse}
And [D]I shall hear, though [G]soft you [D]tread above me
And [G]all my [D]grave will [A7]warmer, sweeter [D]be
For [D]you will bend and [G]tell me [D]that you love me
And [Bm]I shall [Em]sleep in [A7]peace until you [D]come to me
{end_of_verse}
`;

export const DEMO_SONGS: { fileName: string; rawText: string }[] = [
  { fileName: 'Amazing Grace - Traditional.cho', rawText: AMAZING_GRACE },
  { fileName: 'Oh Susanna - Stephen Foster.cho', rawText: OH_SUSANNA },
  { fileName: 'Wayfaring Stranger - Traditional.cho', rawText: WAYFARING_STRANGER },
  { fileName: 'Scarborough Fair - Traditional.cho', rawText: SCARBOROUGH_FAIR },
  { fileName: 'Danny Boy - Traditional.cho', rawText: DANNY_BOY },
];

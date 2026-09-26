# Applied to every file in samples/ before committing:  jq -f samples/redact.jq out/x.json > samples/x.json
#
# The samples are real Actor output. To avoid republishing private individuals' details:
# - Instagram accounts that are not verified become user_1, user_2 ... Their id, full name, bio,
#   links, contacts and avatar are set to null, and every other mention of that username in the
#   file (URLs, captions, bios) is replaced as well. Posts they own lose their post code, URL,
#   @mentions and alt text; comments they wrote lose their id and any @mentions.
# - YouTube comment authors become @user_1, @user_2 ... and lose their channel id.
# - Email addresses are removed from all text, and the `emails` and `phones` fields of every profile are blanked.
# - Signed Instagram CDN URLs (they expire after a few days anyway) become a short placeholder.
# Verified accounts, brands, channels and all counts are otherwise left untouched.

def rx: gsub("(?<c>[.*+?^${}()|\\[\\]\\\\/])"; "\\\(.c)");
def personFields: ["fullName", "id", "biography", "externalUrl", "profilePicUrl", "hdProfilePicUrl",
                   "bioLinks", "emails", "phones", "threadsUsername", "pronouns"];

([.. | objects | select(has("username") and (.isVerified != true)) | .username] | unique) as $ig
| ([.. | objects | select(has("commentId") and has("author")) | .author] | unique) as $yt
| def igAlias($u): "user_" + (($ig | index($u)) + 1 | tostring);
  def ytAlias($a): "@user_" + (($yt | index($a)) + 1 | tostring);
  def aliased: type == "string" and test("^user_[0-9]+$");
  def noMentions: if type == "string" then gsub("@[A-Za-z0-9_.]+"; "@user") else . end;

  # 1) people objects
  walk(
    if type == "object" and has("username") and (.isVerified != true) then
      .username = igAlias(.username)
      | reduce personFields[] as $k (.; if has($k) then .[$k] = null else . end)
    elif type == "object" and has("commentId") and has("author") then
      .author = ytAlias(.author) | .authorChannelId = null
    else . end
  )
  # 2) posts and comments that belong to them
  | walk(
    if type == "object" and (.owner.username? | aliased) and has("text") then
      .id = null | .text |= noMentions
    elif type == "object" and .dataType? == "post" and (.owner.username? | aliased) then
      .code = "REDACTED" | .url = "https://www.instagram.com/p/REDACTED/" | .id = null | .pk = null
      | .mentions = [] | .caption |= noMentions | .accessibilityCaption = null
    else . end
  )
  # 3) remaining mentions of their usernames, emails and phone numbers, anywhere
  | walk(
    if type == "string" then
      (reduce $ig[] as $u (.; if ($u | length) > 3
          then gsub("(?<![A-Za-z0-9_.])" + ($u | rx) + "(?![A-Za-z0-9_])"; igAlias($u)) else . end))
      | gsub("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}"; "(email removed)")
    elif type == "object" and has("phones") and (.phones | type) == "array" then
      .phones |= map("(removed in sample)") | .emails |= (if type == "array" then map("(removed in sample)") else . end)
    else . end
  )
  # 4) expiring CDN links
  | walk(
    if type == "string" and test("^https://[^/]+\\.(cdninstagram\\.com|fbcdn\\.net)/")
    then "https://cdninstagram.com/(signed media URL, expires after a few days)"
    else . end
  )

cd domains/sanrafael360.com/public_html
MEDIA_ID=$(wp media import /home/u269831255/hotel_rex_logo.jpg --post_id=411 --porcelain)
wp post meta set 411 _thumbnail_id $MEDIA_ID
echo "FIXED_MEDIA_ID: $MEDIA_ID"

cd domains/sanrafael360.com/public_html
ID=$(wp post create --post_type=listing --post_title='Hotel Rex – 1 estrella' --post_status=publish --post_author=$(wp user get diegocristianalonso@gmail.com --field=ID) --format=ids)
wp post term add $ID listing_category 32
wp post meta set $ID _friendly_address 'Avda. Hipólito Yrigoyen 56, San Rafael'
wp post meta set $ID _address 'Avda. Hipólito Yrigoyen 56, San Rafael'
wp post meta set $ID _phone '02604-420999'
wp post meta set $ID _whatsapp '2604-014779'
wp post meta set $ID _instagram 'https://www.instagram.com/hotel_rex2024/'
MEDIA_ID=$(wp media import hotel_rex_logo.jpg --post_id=$ID --format=ids)
wp post meta set $ID _thumbnail_id $MEDIA_ID
echo "CREATED_LISTING_ID: $ID"

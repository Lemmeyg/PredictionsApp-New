1
2. uX designs

4. expanded reporting 
6. Prediction lock - once the first fixture of a gameweek kicks off, players can no longer submit or edit predictions for that gameweek. Enforce this by not showing the input controls for that gameweek on the predictions screen (not just a backend check).

11. move the code to this repo on vercel - https://new-predictions-app.vercel.app/ (unconfirmed whether this is the live prod URL -- verify)

15. Predictive stats (xG, form) via football-data.org's paid tier -- nice to have, once free-tier basics are solid.
16. Desktop layout pass -- dedicated breakpoint work for larger screens (current design is mobile-first/narrow-centered throughout), not just "doesn't break" on desktop.
17. In-app admin management -- toggle is_admin for other players without needing the Supabase dashboard.
18. Google Sheets as a backup/export target -- still an open decision, no concrete need identified yet; revisit only if one comes up.
19. Weekly scores breakdown for a completed round -- per-fixture points-earned table for a past round. Distinct from item 5 (which is about the live/open round).
20. Turn on tsconfig strict mode -- most `as X` casts throughout the app pages are currently unchecked as a result of strict:false.
21. Admin results page needs an in-app link + round picker -- currently only reachable by hand-editing `?round=` in the URL.

Complete
3. Make the trophy cup logo look like it's spinning on a horizontal axis every 5 seconds (3D rotateX flip, continuous).
5. visibilty using drop downs into other players scores 
    - a carrot/chevron to the right of each fixture box on the predictions screen; clicking it expands
    - under each team name show 5 colored squares, with either H or A in them. they should represent the teams form with the most resent result to the right. red = loss green = win H= home fixture and A = away. data can be found in the results table. if there are not 5 results to pull from, make the squares black with very thin borders. 
     - under the form, show every other player's initials positioned under the home team, away team, or "VS" depending on what they predicted. The player one rank above you on the leaderboard is highlighted green, the player one rank below you is highlighted red. 
7. Animations on the logo and other items to make it more interactive
8. reset password link in login page
9. line graph of cummulative points over the course of the season by player
10. store and collect points in the predictions table for admin verification
12. create 3 weeks of dummy predictions and results so I can see what the app looks like
13. top scores for the season, ever?, weeks won table, 
14. Back button (small left-pointing arrow, top-left corner) on every page except the home page, linking back to home.

var DD = DD || {};

$( window ).on( "pagechange", function (event, data) {

    if (data.options.target === "/view/contact.html") {

        var contact = data.options.entity,
            person = data.options.relatedEntity,
            donation = contact.Donation || {},
            page = $('div#contact');

        DD.promises.lov.done(function() {

            function toPerson(res) {

                res.LOV_Channel = DD.admin_lov["Contact Channels"].filter(function (e) {return e.LOVID === res.Channel;})[0];
                res.LOV_Fundraiser = DD.admin_lov.Fundraisers.filter(function (e) {return e.LOVID === res.FundRaiser;})[0];
                res.LOV_Outcome = DD.admin_lov["Contact Outcomes"].filter(function (e) {return e.LOVID === res.Outcome;})[0];

                person.ContactID = res.ContactID;
                person.Contacts = person.Contacts || [];
                person.Contacts.push(res);
                $.mobile.changePage( "/view/person.html", {entity: person});

            }

            // ADD BACK HANDLER
            $( 'a[name="back"]', page ).off().on( 'click', toPerson);

            var contactScheduleDate = $("#contact-schedule-date"),
                contactCompleteDate = $("#contact-complete-date"),
                contactFundraiser = $("#contact-fundraiser"),
                contactChannel = $("#contact-channel"),
                contactOutcome = $("#contact-outcome"),
                contactNotes = $("#contact-notes"),

                contactDonationAmount = $("#contact-donation-amount"),
                contactDonationDate = $("#contact-donation-date"),
                contactDonationSource = $("#contact-donation-source"),

                name = ( !!person.Title ? person.Title + ' ' : '' ) +
                    ( !!person.FirstName ? person.FirstName + ' ' : '' ) +
                    ( !!person.LastName ? person.LastName + ' ' : '' ) +
                    ( !!person.Suffix ? person.Suffix + ' ' : '' ) +
                    ( !!person.OrgName ? '( ' + person.OrgName + ' )' : '' );

            $("#contact-person").html(name);

            if (contact.ContactID) {

                if (contact.CompleteDate) {

                    contactCompleteDate.val(DD.dateToInput(new Date(contact.CompleteDate)));

                }

                if (contact.ScheduleDate) {

                    contactScheduleDate.val(DD.dateToInput(new Date(contact.ScheduleDate)));

                }

            }

            contactNotes.val(contact.Notes || "");

            $.each(DD.lov["Contact Channels"], function (i, opt) {
                var option = "";

                option += '<option value="' + opt.id + '"';
                if (contact.Channel === opt.id) {
                    option += "checked=checked";
                }
                option += '>' + opt.displayName;
                option += '</option>';
                $(option).appendTo(contactChannel);
                contactChannel.selectmenu("refresh");
            });

            $.each(DD.lov["Fundraisers"], function (i, opt) {
                var option = "";

                option += '<option value="' + opt.id + '"';
                if (contact.Fundraiser === opt.id) {
                    option += "checked=checked";
                }
                option += '>' + opt.displayName;
                option += '</option>';
                $(option).appendTo(contactFundraiser);
                contactFundraiser.selectmenu("refresh");
            });

            $.each(DD.lov["Contact Outcomes"], function (i, opt) {
                var option = "";

                option += '<option value="' + opt.id + '"';
                if (contact.Outcome === opt.id) {
                    option += "checked=checked";
                }
                option += '>' + opt.displayName;
                option += '</option>';
                $(option).appendTo(contactOutcome);
                contactOutcome.selectmenu("refresh");
            });

            //BIND DONATION
            $.each(DD.lov["Donation Sources"], function(i, opt) {
                var option = "";

                option += '<option value="' + opt.id + '"';
                if (donation.Source === opt.id) {
                    option += "checked=checked";
                }
                option += '>' + opt.displayName;
                option += '</option>';
                $(option).appendTo(contactDonationSource);
                contactDonationSource.selectmenu("refresh");
            });

            contactDonationAmount.val( donation.Amount );
            contactDonationDate.val(DD.dateToInput(new Date(donation.DonationDate)));

            // ADD SAVE HANDLER
            $( 'a[name="save"]', page ).off().on( 'click', function() {

                var deferreds = [], cloneContact, cloneDonation;

                //SERIALIZE CONTACT
                contact.ScheduleDate = DD.inputToSQLDate(contactScheduleDate.val());
                contact.CompleteDate = DD.inputToSQLDate(contactCompleteDate.val());
                contact.Fundraiser = contactFundraiser.val();
                contact.Channel = contactChannel.val();
                contact.Outcome = contactOutcome.val();
                contact.Notes = contactNotes.val();
                contact.PersonID = person.PersonID;

                //SERIALIZE DONATION
                donation.Amount = contactDonationAmount.val();
                donation.DonationDate = DD.inputToSQLDate(contactDonationDate.val());;
                donation.PersonID = person.PersonID;
                donation.Source = contactDonationSource.val();

                //DONT PUT LOV DATA
                cloneDonation = JSON.parse(JSON.stringify(donation));
                cloneContact = JSON.parse(JSON.stringify(contact));

                delete cloneContact.LOV_Channel;
                delete cloneContact.LOV_Fundraiser;
                delete cloneContact.LOV_Outcome;

                delete cloneDonation.LOV_Source;

                if( !contact.ContactID ) {
                    // NEW CONTACT
                    //CHECK FOR DONATION INFO
                    if (donation.Amount) {
                        //CHECK FOR DONATION ID
                        if (donation.DonationID) {
                            deferreds.push($.ajax(DD.api.donation + "/" + donation.DonationID, {
                                type: 'PUT',
                                data: JSON.stringify(cloneDonation),
                                contentType: "application/json"
                            }));
                        } else {
                            deferreds.push($.ajax(DD.api.donation, {
                                type: "POST",
                                data: JSON.stringify(cloneDonation),
                                dataType: "json",
                                contentType: "application/json"
                            }).done(function (res) {
                                contact.DonationID = res.DonationID;
                                contact.Donation = res.Donation;
                            }));
                        }
                    }
                    $.when.apply($, deferreds).done(function () {
                        $.ajax({
                            url: DD.api.contact,
                            type: "POST",
                            data: JSON.stringify(cloneContact),
                            dataType: "json",
                            contentType: "application/json"
                        }).done(toPerson)
                            .fail(DD.error);

                    }).fail(DD.error);
                } else {
                    // CONTACT EXISTS
                    //CHECK FOR DONATION INFO
                    if (donation.Amount) {
                        //CHECK FOR DONATION ID
                        if (donation.DonationID) {
                            deferreds.push($.ajax( DD.api.donation + "/" + donation.DonationID, {
                                type: 'PUT',
                                data: JSON.stringify(cloneDonation),
                                contentType: 'application/json'
                            }));
                        } else {
                            deferreds.push($.ajax(DD.api.donation, {
                                type: "POST",
                                data: JSON.stringify(cloneDonation),
                                dataType: "json",
                                contentType: "application/json"
                            }).done(function (res) {
                                contact.DonationID = res.DonationID;
                                contact.Donation = res.Donation;
                            }));
                        }
                    }
                    $.when.apply($, deferreds).done(function () {
                        $.ajax( DD.api.contact + "/" + contact.ContactID, {
                            type: 'PUT',
                            data: JSON.stringify(cloneContact),
                            contentType: 'application/json'
                        })
                        .done(toPerson)
                        .fail(DD.error);
                    })
                    .fail(DD.error);
                }
            });


        });

    }

});